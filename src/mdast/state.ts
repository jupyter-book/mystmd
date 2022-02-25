import { Content, Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAndReplace } from 'mdast-util-find-and-replace';
import { GenericNode } from '.';
import { normalizeLabel, setTextAsChild } from './utils';

export enum TargetKind {
  heading = 'heading',
  math = 'math',
  figure = 'figure',
  table = 'table',
  code = 'code',
}

export enum ReferenceKind {
  ref = 'ref',
  numref = 'numref',
  eq = 'eq',
}

type Target = {
  node: GenericNode;
  kind: TargetKind;
  number: string;
};

/**
 * See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
 */
function fillReferenceNumbers(node: GenericNode, number: string | number) {
  const num = String(number);
  findAndReplace(node as Content, { '%s': num, '{number}': num });
}

function copyNode(node: GenericNode): GenericNode {
  return JSON.parse(JSON.stringify(node));
}

export class State {
  targets: Record<string, Target>;
  targetCounts: Record<string, number>;

  constructor(targetCounts?: Record<string, number>, targets?: Record<string, Target>) {
    this.targetCounts = targetCounts || {};
    this.targets = targets || {};
  }

  addTarget(node: GenericNode) {
    const kind: string | undefined = node.type === 'container' ? node.kind : node.type;
    node = copyNode(node);
    if (kind && kind in TargetKind && node.identifier) {
      if (kind === TargetKind.heading) {
        this.targets[node.identifier] = { node, kind, number: '' };
      } else {
        this.targets[node.identifier] = {
          node,
          kind: kind as TargetKind,
          number: String(this.incrementCount(kind)),
        };
      }
    }
  }

  incrementCount(kind: string): number {
    if (kind in this.targetCounts) {
      this.targetCounts[kind] += 1;
    } else {
      this.targetCounts[kind] = 1;
    }
    return this.targetCounts[kind];
  }

  getTarget(identifier?: string): Target | undefined {
    if (!identifier) return undefined;
    return this.targets[identifier];
  }

  resolveReferenceContent(node: GenericNode): GenericNode['children'] | undefined {
    const target = this.getTarget(node.identifier);
    if (!target) {
      return;
    }
    const kinds = {
      ref: {
        eq: node.kind === ReferenceKind.eq,
        ref: node.kind === ReferenceKind.ref,
        numref: node.kind === ReferenceKind.numref,
      },
      target: {
        math: target.kind === TargetKind.math,
        figure: target.kind === TargetKind.figure,
        table: target.kind === TargetKind.table,
        heading: target.kind === TargetKind.heading,
      },
    };
    const noNodeChildren = !node.children?.length;
    if (kinds.ref.eq && kinds.target.math) {
      if (noNodeChildren) {
        setTextAsChild(node, `(${target.number})`);
      }
      node.resolved = true;
    } else if (kinds.ref.ref && kinds.target.heading) {
      if (noNodeChildren) {
        node.children = copyNode(target.node).children;
      }
      node.resolved = true;
    } else if (kinds.ref.ref && (kinds.target.figure || kinds.target.table)) {
      if (noNodeChildren) {
        const caption = select('caption > paragraph', target.node) as GenericNode;
        node.children = copyNode(caption).children;
      }
      node.resolved = true;
    } else if (kinds.ref.numref && kinds.target.figure) {
      if (noNodeChildren) {
        setTextAsChild(node, 'Figure %s');
      }
      fillReferenceNumbers(node, target.number);
      node.resolved = true;
    } else if (kinds.ref.numref && kinds.target.table) {
      if (noNodeChildren) {
        setTextAsChild(node, 'Table %s');
      }
      fillReferenceNumbers(node, target.number);
      node.resolved = true;
    }
  }
}

export const countState = (state: State, tree: Root) => {
  visit(tree, 'container', (node: GenericNode) => state.addTarget(node));
  visit(tree, 'math', (node: GenericNode) => state.addTarget(node));
  visit(tree, 'heading', (node) => state.addTarget(node as GenericNode));
  return tree;
};

export const referenceState = (state: State, tree: Root) => {
  selectAll('link', tree).map((node: GenericNode) => {
    const reference = normalizeLabel(node.url);
    if (reference && reference.identifier in state.targets) {
      node.type = 'contentReference';
      node.kind =
        state.targets[reference.identifier].kind === TargetKind.math ? 'eq' : 'ref';
      node.identifier = reference.identifier;
      node.label = reference.label;
      node.resolved = false;
      delete node.url;
    }
  });
  visit(tree, 'contentReference', (node: GenericNode) => {
    state.resolveReferenceContent(node);
  });
};
