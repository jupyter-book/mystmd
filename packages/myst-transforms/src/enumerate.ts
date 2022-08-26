import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { Content, Root } from 'mdast';
import type {
  Container,
  CrossReference,
  Heading,
  Link,
  Math,
  Node,
  Paragraph,
  Parent,
  StaticPhrasingContent,
} from 'myst-spec';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAndReplace } from 'mdast-util-find-and-replace';
import { createHtmlId, fileWarn, normalizeLabel, setTextAsChild } from './utils';

const TRANSFORM_NAME = 'myst-transforms:enumerate';

type ResolvableCrossReference = CrossReference & { resolved?: boolean };

export enum TargetKind {
  heading = 'heading',
  equation = 'equation',
  figure = 'figure',
  table = 'table',
  code = 'code',
}

export enum ReferenceKind {
  ref = 'ref',
  numref = 'numref',
  eq = 'eq',
}

type TargetNodes = Container | Math | Heading;

type Target = {
  node: TargetNodes;
  kind: TargetKind | string;
};

type TargetCounts = {
  heading?: (number | null)[];
} & Record<string, number>;

export type StateOptions = {
  state: IReferenceState;
};

export type NumberingOptions = {
  enumerator?: string;
  figure?: boolean;
  equation?: boolean;
  table?: boolean;
  code?: boolean;
  heading_1?: boolean;
  heading_2?: boolean;
  heading_3?: boolean;
  heading_4?: boolean;
  heading_5?: boolean;
  heading_6?: boolean;
};

/**
 * See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
 */
function fillReferenceEnumerators(node: Node, enumerator: string | number) {
  const num = String(enumerator);
  findAndReplace(node as Content, { '%s': num, '{number}': num });
}

function copyNode<T extends Node>(node: T): T {
  return JSON.parse(JSON.stringify(node));
}

function kindFromNode(node: TargetNodes): TargetKind | string | undefined {
  if (node.type === 'container') return node.kind;
  if (node.type === 'math') return TargetKind.equation;
  return node.type;
}

function shouldEnumerate(
  node: TargetNodes,
  kind: TargetKind | string,
  numbering: NumberingOptions,
  override?: boolean | null,
) {
  if (typeof override === 'boolean') return override;
  if (kind === 'heading' && node.type === 'heading') {
    return numbering[`heading_${node.depth}` as keyof Omit<NumberingOptions, 'enumerator'>];
  }
  return numbering[kind as keyof Omit<NumberingOptions, 'enumerator'>] ?? false;
}

/**
 * Increment heading counts based on depth to increment
 *
 * depth is the depth to increment
 * counts is a list of 6 counts, corresponding to 6 heading depths
 *
 * When a certain depth is incremented, shallower depths are left the same
 * and deeper depths are reset to zero. Null counts anywhere are ignored.
 */
export function incrementHeadingCounts(
  depth: number,
  counts: (number | null)[],
): (number | null)[] {
  const incrementIndex = depth - 1;
  return counts.map((count, index) => {
    if (count === null || index < incrementIndex) return count;
    if (index === incrementIndex) return count + 1;
    return 0;
  });
}

/**
 * Return dot-delimited header numbering based on heading counts
 *
 * counts is a list of 6 counts, corresponding to 6 heading depths
 *
 * Leading zeros are kept, trailing zeros are removed, nulls are ignored.
 */
export function formatHeadingEnumerator(counts: (number | null)[], prefix?: string): string {
  counts = counts.filter((d) => d !== null);
  while (counts && counts[counts.length - 1] === 0) {
    counts.pop();
  }
  const enumerator = counts.join('.');
  const out = prefix ? prefix.replace(/%s/g, String(enumerator)) : String(enumerator);
  return out;
}

export interface IReferenceState {
  initializeNumberedHeadingDepths: (tree: Root) => void;
  addTarget: (node: TargetNodes) => void;
  /**
   * If the page is provided, it will only look at that page.
   */
  getTarget: (identifier?: string, page?: string) => Target | undefined;
  resolveReferenceContent: (node: ResolvableCrossReference) => void;
}

export class ReferenceState implements IReferenceState {
  file?: VFile;
  numberAll: boolean | null = null;
  numbering: NumberingOptions;
  targets: Record<string, Target>;
  targetCounts: TargetCounts;

  constructor(opts?: {
    targetCounts?: TargetCounts;
    numbering?: boolean | NumberingOptions;
    file?: VFile;
  }) {
    this.targetCounts = opts?.targetCounts || {};
    if (typeof opts?.numbering === 'boolean') {
      this.numberAll = opts?.numbering;
      this.numbering = {};
    } else {
      this.numbering = { equation: true, figure: true, table: true, ...opts?.numbering };
    }
    this.targets = {};
    this.file = opts?.file;
  }

  addTarget(node: TargetNodes) {
    const kind = kindFromNode(node);
    if (kind && kind in TargetKind) {
      const numberNode = shouldEnumerate(node, kind, this.numbering, this.numberAll);
      let enumerator = null;
      if (node.enumerated !== false && numberNode) {
        enumerator = this.incrementCount(node, kind as TargetKind);
        node.enumerator = enumerator;
      }
      if (!(node as any).html_id) {
        (node as any).html_id = createHtmlId(node.identifier);
      }
      if (node.identifier && this.targets[node.identifier]) {
        if (!this.file) return;
        if ((node as any).implicit) return; // Do not warn on implicit headings
        fileWarn(
          this.file,
          `Duplicate identifier "${node.identifier}" for node of type ${node.type}`,
          {
            node,
            source: TRANSFORM_NAME,
          },
        );
        return;
      }
      if (node.identifier) {
        this.targets[node.identifier] = {
          node: copyNode(node),
          kind: kind as TargetKind,
        };
      }
    }
  }

  initializeNumberedHeadingDepths(tree: Root) {
    const headings = selectAll('heading', tree).filter(
      (node) => (node as Heading).enumerated !== false,
    );
    const headingDepths = new Set(headings.map((node) => (node as Heading).depth));
    this.targetCounts.heading = [1, 2, 3, 4, 5, 6].map((depth) =>
      headingDepths.has(depth) ? 0 : null,
    );
  }

  incrementCount(node: TargetNodes, kind: TargetKind | string): string {
    if (kind === TargetKind.heading && node.type === 'heading') {
      // Ideally initializeNumberedHeadingDepths is called before incrementing
      // heading count to do a better job initializng headers based on tree
      if (!this.targetCounts.heading) this.targetCounts.heading = [0, 0, 0, 0, 0, 0];
      this.targetCounts.heading = incrementHeadingCounts(node.depth, this.targetCounts.heading);
      return formatHeadingEnumerator(this.targetCounts.heading, this.numbering.enumerator);
    }
    if (kind in this.targetCounts) {
      this.targetCounts[kind] += 1;
    } else {
      this.targetCounts[kind] = 1;
    }
    const enumerator = this.targetCounts[kind];
    const prefix = this.numbering.enumerator;
    const out = prefix ? prefix.replace(/%s/g, String(enumerator)) : String(enumerator);
    return out;
  }

  getTarget(identifier?: string): Target | undefined {
    if (!identifier) return undefined;
    return this.targets[identifier];
  }

  resolveReferenceContent(node: ResolvableCrossReference) {
    const target = this.getTarget(node.identifier);
    if (!target) {
      this.warnNodeTargetNotFound(node);
      return;
    }
    const kinds = {
      ref: {
        eq: node.kind === ReferenceKind.eq,
        ref: node.kind === ReferenceKind.ref,
        numref: node.kind === ReferenceKind.numref,
      },
      target: {
        math: target.kind === TargetKind.equation,
        figure: target.kind === TargetKind.figure,
        table: target.kind === TargetKind.table,
        heading: target.kind === TargetKind.heading,
        code: target.kind === TargetKind.code,
      },
    };
    const noNodeChildren = !node.children?.length;
    if (kinds.target.math && target.node.enumerator) {
      if (noNodeChildren) {
        setTextAsChild(node, '(%s)');
      }
      fillReferenceEnumerators(node, target.node.enumerator);
      node.resolved = true;
    } else if (kinds.target.heading && !target.node.enumerator) {
      if (noNodeChildren) {
        node.children = copyNode(target.node as Parent).children as StaticPhrasingContent[];
      }
      node.resolved = true;
    } else if (kinds.target.heading && target.node.enumerator) {
      if (noNodeChildren) {
        setTextAsChild(node, 'Section %s');
      }
      fillReferenceEnumerators(node, target.node.enumerator);
      node.resolved = true;
    } else if (kinds.ref.ref && (kinds.target.figure || kinds.target.table || kinds.target.code)) {
      if (noNodeChildren) {
        const caption = select('caption > paragraph', target.node) as Paragraph;
        node.children = copyNode(caption).children as StaticPhrasingContent[];
      }
      node.resolved = true;
    } else if (kinds.ref.numref && kinds.target.figure && target.node.enumerator) {
      if (noNodeChildren) {
        setTextAsChild(node, 'Figure %s');
      }
      fillReferenceEnumerators(node, target.node.enumerator);
      node.resolved = true;
    } else if (kinds.ref.numref && kinds.target.table && target.node.enumerator) {
      if (noNodeChildren) {
        setTextAsChild(node, 'Table %s');
      }
      fillReferenceEnumerators(node, target.node.enumerator);
      node.resolved = true;
    } else if (kinds.ref.numref && kinds.target.code && target.node.enumerator) {
      if (noNodeChildren) {
        setTextAsChild(node, 'Program %s');
      }
      fillReferenceEnumerators(node, target.node.enumerator);
      node.resolved = true;
    }
    if (node.resolved) {
      // It may have changed in the lookup, but unlikely
      node.identifier = target.node.identifier;
    } else {
      this.warnNodeNotResolved(node);
      return;
    }
  }

  warnNodeTargetNotFound(node: ResolvableCrossReference) {
    if (!this.file) return;
    fileWarn(this.file, `Cross reference was not found: ${node.identifier}`, {
      node,
      source: TRANSFORM_NAME,
    });
  }
  warnNodeNotResolved(node: ResolvableCrossReference) {
    if (!this.file) return;
    fileWarn(this.file, `Cross reference was not resolved: ${node.identifier}`, {
      node,
      source: TRANSFORM_NAME,
    });
  }
}

type IStateList = { state: IReferenceState; file: string; url: string | null }[];
type StateAndFile = { state: ReferenceState; file: string; url: string | null };

export class MultiPageReferenceState implements IReferenceState {
  states: StateAndFile[];
  fileState: ReferenceState;
  filePath: string;
  url: string;
  constructor(states: IStateList, filePath: string) {
    this.states = states as StateAndFile[];
    this.fileState = states.filter((v) => v.file === filePath)[0]?.state as ReferenceState;
    this.url = states.filter((v) => v.file === filePath)[0]?.url as string;
    this.filePath = filePath;
  }

  resolveStateProvider(identifier?: string, page?: string): StateAndFile | undefined {
    if (!identifier) return undefined;
    const local = this.fileState.getTarget(identifier);
    if (local) return { state: this.fileState, file: this.filePath, url: this.url };
    const pageXRefs = this.states.find(({ state }) => !!state.getTarget(identifier));
    return pageXRefs;
  }

  addTarget(node: TargetNodes) {
    return this.fileState.addTarget(node);
  }

  initializeNumberedHeadingDepths(tree: Root) {
    return this.fileState.initializeNumberedHeadingDepths(tree);
  }

  getTarget(identifier?: string, page?: string): Target | undefined {
    const pageXRefs = this.resolveStateProvider(identifier, page);
    return pageXRefs?.state.getTarget(identifier);
  }

  resolveReferenceContent(node: ResolvableCrossReference) {
    const pageXRefs = this.resolveStateProvider(node.identifier);
    if (!pageXRefs) {
      this.fileState.warnNodeTargetNotFound(node);
      return;
    }
    pageXRefs?.state.resolveReferenceContent(node);
    if (node.resolved && pageXRefs?.file !== this.filePath) {
      (node as any).remote = true;
      (node as any).url = pageXRefs.url;
    }
  }
}

export const enumerateTargetsTransform = (tree: Root, opts: StateOptions) => {
  opts.state.initializeNumberedHeadingDepths(tree);
  visit(tree, 'container', (node: Container) => opts.state.addTarget(node));
  visit(tree, 'math', (node: Math) => opts.state.addTarget(node));
  visit(tree, 'heading', (node) => opts.state.addTarget(node as Heading));
  return tree;
};

export const enumerateTargetsPlugin: Plugin<[StateOptions], Root, Root> = (opts) => (tree) => {
  enumerateTargetsTransform(tree, opts);
};

function getCaptionLabel(kind?: string) {
  switch (kind) {
    case 'table':
      return 'Table %s:';
    case 'code':
      return 'Program %s:';
    case 'figure':
    default:
      return 'Figure %s:';
  }
}

/** Visit all containers and add captions */
export function addContainerCaptionNumbersTransform(tree: Root, opts: StateOptions) {
  const containers = selectAll('container', tree) as Container[];
  containers
    .filter((container: Container) => container.enumerator)
    .forEach((container: Container) => {
      const enumerator = opts.state.getTarget(container.identifier)?.node.enumerator;
      const para = select('caption > paragraph', container) as Container;
      if (enumerator && para && (para.children[0].type as string) !== 'captionNumber') {
        const captionNumber = {
          type: 'captionNumber',
          kind: container.kind,
          identifier: container.identifier,
          html_id: (container as any).html_id,
          enumerator,
        };
        setTextAsChild(captionNumber, getCaptionLabel(container.kind));
        fillReferenceEnumerators(captionNumber, enumerator);
        // The caption number is in the paragraph, it needs a link to the figure container
        // This is a bit awkward, but necessary for (efficient) rendering
        para.children = [captionNumber as any, ...(para?.children ?? [])];
      }
    });
}

export const resolveReferenceLinksTransform = (tree: Root, opts: StateOptions) => {
  selectAll('link', tree).forEach((node) => {
    const link = node as Link;
    const reference = normalizeLabel(link.url);
    const target = opts.state.getTarget(reference?.identifier);
    if (reference && target) {
      const xref = link as unknown as CrossReference;
      xref.type = 'crossReference';
      xref.kind = target.kind === TargetKind.equation ? 'eq' : 'ref';
      xref.identifier = reference.identifier;
      xref.label = reference.label;
      delete (xref as any).url;
    }
  });
};

export const resolveCrossReferencesTransform = (tree: Root, opts: StateOptions) => {
  visit(tree, 'crossReference', (node: CrossReference) => {
    opts.state.resolveReferenceContent(node);
  });
};

export const resolveReferencesTransform = (tree: Root, opts: StateOptions) => {
  resolveReferenceLinksTransform(tree, opts);
  resolveCrossReferencesTransform(tree, opts);
  addContainerCaptionNumbersTransform(tree, opts);
};

export const resolveReferencesPlugin: Plugin<[StateOptions], Root, Root> = (opts) => (tree) => {
  resolveReferencesTransform(tree, opts);
};
