/* eslint-disable no-param-reassign */

import { Plugin } from 'unified';
import { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { select } from 'unist-util-select';
import { GenericNode } from './mdast';

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

export class State {
  targets: Record<string, Target>;
  targetCounts: Record<string, number>;

  constructor(targetCounts?: Record<string, number>, targets?: Record<string, Target>) {
    this.targetCounts = targetCounts || {};
    this.targets = targets || {};
  }

  addTarget(node: GenericNode) {
    const kind: string | undefined = node.type === 'container' ? node.kind : node.type;
    node = JSON.parse(JSON.stringify(node));
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

  getReferenceMdast(
    refIdentifier: string,
    refKind: string,
    refValue?: string,
  ): GenericNode | undefined {
    const target = this.getTarget(refIdentifier);
    let text = refValue;
    if (!target) {
      return;
    } else if (refKind === ReferenceKind.eq && target.kind === TargetKind.math) {
      text = text || `(${target.number})`;
    } else if (refKind === ReferenceKind.ref && target.kind === TargetKind.heading) {
      if (!text) {
        return target.node;
      }
    } else if (refKind === ReferenceKind.ref && target.kind === TargetKind.figure) {
      if (!text) {
        return select('caption > paragraph', target.node) as GenericNode;
      }
    } else if (refKind === ReferenceKind.numref && target.kind === TargetKind.figure) {
      text = refValue
        ? refValue.replace(/%s/g, target.number).replace(/\{number\}/g, target.number)
        : `Fig. ${target.number}`;
    } else {
      return;
    }
    return { type: '_', children: [{ type: text, value: text }] };
  }
}

export const updateState: Plugin<[State], string, Root> = (state) => (tree: Root) => {
  visit(tree, 'container', (node: GenericNode) => state.addTarget(node));
  visit(tree, 'math', (node: GenericNode) => state.addTarget(node));
  visit(tree, 'heading', (node) => state.addTarget(node as GenericNode));
  return tree;
};
