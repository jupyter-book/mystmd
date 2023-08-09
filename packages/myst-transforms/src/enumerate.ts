import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { Container, CrossReference, Heading, Link, Math, Paragraph } from 'myst-spec';
import type { PhrasingContent } from 'mdast';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAndReplace } from 'mdast-util-find-and-replace';
import type { GenericNode, GenericParent } from 'myst-common';
import {
  createHtmlId,
  fileWarn,
  normalizeLabel,
  setTextAsChild,
  copyNode,
  liftChildren,
} from 'myst-common';

const TRANSFORM_NAME = 'myst-transforms:enumerate';

type ResolvableCrossReference = Omit<CrossReference, 'kind'> & {
  kind?: TargetKind | string;
  enumerator?: string;
  template?: string;
  resolved?: boolean;
  // If the cross reference is remote, then it will have a URL attached
  // This URL should be able to lookup the content; dataUrl is a direct link to structured mdast source data
  remote?: boolean;
  url?: string;
  dataUrl?: string;
  html_id?: string;
};

export enum TargetKind {
  heading = 'heading',
  equation = 'equation',
  figure = 'figure',
  table = 'table',
  code = 'code',
}

function getDefaultNumberedReferenceLabel(kind: TargetKind | string) {
  switch (kind) {
    case TargetKind.heading:
      return 'Section %s';
    case TargetKind.equation:
      return '(%s)';
    case TargetKind.figure:
      return 'Figure %s';
    case TargetKind.table:
      return 'Table %s';
    case TargetKind.code:
      return 'Program %s';
    default: {
      const domain = kind.includes(':') ? kind.split(':')[1] : kind;
      // eslint-disable-next-line no-irregular-whitespace
      return `${domain.slice(0, 1).toUpperCase()}${domain.slice(1)} %s`;
    }
  }
}

function getDefaultNamedReferenceLabel(kind: TargetKind | string, hasTitle: boolean) {
  const domain = kind.includes(':') ? kind.split(':')[1] : kind;
  const name = `${domain.slice(0, 1).toUpperCase()}${domain.slice(1)}`;
  switch (kind) {
    // TODO: These need to be moved to the directive definition in an extension
    case 'proof':
    case 'exercise':
      return hasTitle ? `${name} ({name})` : name;
    default:
      if (hasTitle) return '{name}';
      return name;
  }
}

export enum ReferenceKind {
  ref = 'ref',
  numref = 'numref',
  eq = 'eq',
}

type TargetNodes = (Container | Math | Heading) & { html_id: string };
type IdentifierNodes = { type: string; identifier: string };

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

const UNKNOWN_REFERENCE_ENUMERATOR = '??';

/**
 * See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
 */
function fillReferenceEnumerators(
  file: VFile | undefined,
  node: Pick<
    ResolvableCrossReference,
    'label' | 'identifier' | 'children' | 'template' | 'enumerator'
  > & { type: string },
  template: string,
  enumerator?: string | number,
  title?: string | PhrasingContent[],
) {
  const noNodeChildren = !node.children?.length;
  if (noNodeChildren) {
    setTextAsChild(node, template);
  }
  const num = enumerator != null ? String(enumerator) : UNKNOWN_REFERENCE_ENUMERATOR;
  if (!node.template) node.template = template;
  if (num && num !== UNKNOWN_REFERENCE_ENUMERATOR) node.enumerator = num;
  const used = {
    s: false,
    number: false,
    name: false,
  };
  findAndReplace(node as any, {
    '%s': () => {
      used.s = true;
      return num;
    },
    '{number}': () => {
      used.number = true;
      return num;
    },
    '{name}': () => {
      used.name = true;
      return title || node.label || node.identifier;
    },
  });
  if (num === UNKNOWN_REFERENCE_ENUMERATOR && (used.number || used.s) && file) {
    const numberType =
      used.number && used.s ? '"{number}" and "%s"' : `${used.number ? '"number"' : '"%s"'}`;
    fileWarn(
      file,
      `Reference for "${node.identifier}" uses ${numberType} in the template, but node is not numbered.`,
      {
        node,
        note: 'The node was filled in with "??" as the number.',
        source: TRANSFORM_NAME,
      },
    );
  }
}

function kindFromNode(node: TargetNodes): TargetKind | string {
  if (node.type === 'container') return node.kind || TargetKind.figure;
  if (node.type === 'math') return TargetKind.equation;
  if ((node as any).kind) return `${node.type}:${(node as any).kind}`;
  return node.type;
}

function shouldEnumerate(
  node: TargetNodes,
  kind: TargetKind | string,
  numbering: NumberingOptions,
  override?: boolean | null,
): boolean {
  if (typeof override === 'boolean') return override;
  if (kind === 'heading' && node.type === 'heading') {
    return (
      numbering[`heading_${node.depth}` as keyof Omit<NumberingOptions, 'enumerator'>] ?? false
    );
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
  file?: VFile;
  initializeNumberedHeadingDepths: (tree: GenericParent) => void;
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
      this.numbering = {
        equation: true,
        figure: true,
        table: true,
        code: true,
        ...opts?.numbering,
      };
    }
    this.targets = {};
    this.file = opts?.file;
  }

  addTarget(node: TargetNodes) {
    const possibleIncorrectNode = node as IdentifierNodes;
    if (
      possibleIncorrectNode.type === 'crossReference' ||
      possibleIncorrectNode.type === 'cite' ||
      possibleIncorrectNode.type === 'footnoteDefinition' ||
      possibleIncorrectNode.type === 'footnoteReference'
    ) {
      // Explicitly filter out crossReferences, citations, and footnoteDefinition
      // These are not targets, but do have an "identifier" property
      // Footnotes are resolved differently
      return;
    }
    const kind = kindFromNode(node);
    const numberNode = shouldEnumerate(
      node,
      kind,
      this.numbering,
      this.numberAll || node.enumerated,
    );
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
        node,
        kind: kind as TargetKind,
      };
    }
  }

  initializeNumberedHeadingDepths(tree: GenericParent) {
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
    // Put the kind on the node so we can use that later
    node.kind = target.kind;
    const noNodeChildren = !node.children?.length;
    if (target.kind === TargetKind.heading) {
      const numberHeading = shouldEnumerate(
        target.node,
        TargetKind.heading,
        this.numbering,
        this.numberAll,
      );
      // The default for a heading changes if it is numbered
      const headingTemplate = numberHeading ? 'Section %s' : '{name}';
      fillReferenceEnumerators(
        this.file,
        node,
        headingTemplate,
        target.node.enumerator,
        copyNode(target.node as Heading).children as PhrasingContent[],
      );
    } else if (target.kind === TargetKind.equation) {
      fillReferenceEnumerators(this.file, node, '(%s)', target.node.enumerator);
    } else {
      // By default look into the caption or admonition title if it exists
      const caption =
        select('caption', target.node) ||
        select('admonitionTitle', target.node) ||
        select('definitionTerm', target.node);
      // Ensure we are getting the first paragraph
      const captionParagraph = (
        caption ? select('paragraph', caption) ?? caption : caption
      ) as Paragraph | null;
      const title = captionParagraph
        ? (copyNode(captionParagraph)?.children as PhrasingContent[])
        : undefined;
      if (title && node.kind === ReferenceKind.ref && noNodeChildren) {
        node.children = title as any;
      }
      const template = target.node.enumerator
        ? getDefaultNumberedReferenceLabel(target.kind)
        : getDefaultNamedReferenceLabel(target.kind, !!title);
      fillReferenceEnumerators(this.file, node, template, target.node.enumerator, title);
    }
    node.resolved = true;
    // The identifier may have changed in the lookup, but unlikely
    node.identifier = target.node.identifier;
    node.html_id = target.node.html_id;
  }

  warnNodeTargetNotFound(node: ResolvableCrossReference) {
    if (!this.file) return;
    fileWarn(this.file, `Cross reference target was not found: ${node.identifier}`, {
      node,
      source: TRANSFORM_NAME,
    });
  }
}

type StateAndFile = {
  state: ReferenceState;
  file: string;
  url: string | null;
  dataUrl: string | null;
};
type IStateList = StateAndFile[];

export class MultiPageReferenceState implements IReferenceState {
  file?: VFile; // A copy of the local file for reporting and errors or warnings about the reference linking
  states: StateAndFile[];
  fileState: ReferenceState;
  filePath: string;
  url: string;
  dataUrl: string;

  constructor(states: IStateList, filePath: string) {
    const stateItem = states.filter((v) => v.file === filePath)[0];
    this.states = states as StateAndFile[];
    this.fileState = stateItem?.state as ReferenceState;
    this.file = this.fileState?.file;
    this.url = stateItem?.url as string;
    this.dataUrl = stateItem?.dataUrl as string;
    this.filePath = filePath;
  }

  resolveStateProvider(identifier?: string, page?: string): StateAndFile | undefined {
    if (!identifier) return undefined;
    const local = this.fileState.getTarget(identifier);
    if (local) {
      return { state: this.fileState, file: this.filePath, url: this.url, dataUrl: this.dataUrl };
    }
    const pageXRefs = this.states.find(({ state }) => !!state.getTarget(identifier));
    return pageXRefs;
  }

  addTarget(node: TargetNodes) {
    return this.fileState.addTarget(node);
  }

  initializeNumberedHeadingDepths(tree: GenericParent) {
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
      node.remote = true;
      node.url = pageXRefs.url || undefined;
      node.dataUrl = pageXRefs.dataUrl || undefined;
    }
  }
}

export const enumerateTargetsTransform = (tree: GenericParent, opts: StateOptions) => {
  opts.state.initializeNumberedHeadingDepths(tree);
  const nodes = selectAll('container,math,heading,proof,[identifier],[enumerated=true]', tree) as (
    | TargetNodes
    | IdentifierNodes
  )[];
  nodes.forEach((node) => {
    opts.state.addTarget(node as TargetNodes);
  });
  return tree;
};

export const enumerateTargetsPlugin: Plugin<[StateOptions], GenericParent, GenericParent> =
  (opts) => (tree) => {
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
export function addContainerCaptionNumbersTransform(
  tree: GenericParent,
  file: VFile,
  opts: StateOptions,
) {
  const containers = selectAll('container', tree) as Container[];
  containers
    .filter((container: Container) => container.enumerator)
    .forEach((container: Container) => {
      const enumerator = opts.state.getTarget(container.identifier)?.node.enumerator;
      const para = select('caption > paragraph', container) as Container;
      if (enumerator && para && (para.children[0]?.type as string) !== 'captionNumber') {
        const captionNumber = {
          type: 'captionNumber',
          kind: container.kind,
          label: container.label,
          identifier: container.identifier,
          html_id: (container as any).html_id,
          enumerator,
        };
        fillReferenceEnumerators(file, captionNumber, getCaptionLabel(container.kind), enumerator);
        // The caption number is in the paragraph, it needs a link to the figure container
        // This is a bit awkward, but necessary for (efficient) rendering
        para.children = [captionNumber as any, ...(para?.children ?? [])];
      }
    });
}

export const resolveReferenceLinksTransform = (tree: GenericParent, opts: StateOptions) => {
  selectAll('link', tree).forEach((node) => {
    const link = node as Link;
    const identifier = link.url.replace(/^#/, '');
    const reference = normalizeLabel(identifier);
    const target = opts.state.getTarget(identifier) ?? opts.state.getTarget(reference?.identifier);
    if (!target || !reference) {
      if (!opts.state.file || !link.url.startsWith('#')) return;
      // Only warn on explicit internal URLs
      fileWarn(opts.state.file, `No target for internal reference "${link.url}" was found.`, {
        node,
        source: TRANSFORM_NAME,
      });
      return;
    }
    if (!link.url.startsWith('#') && opts.state.file) {
      fileWarn(
        opts.state.file,
        `Legacy syntax used for link target, please prepend a '#' to your link url: "${link.url}"`,
        {
          node,
          note: 'The link target should be of the form `[](#target)`, including the `#` sign.\nThis may be deprecated in the future.',
          source: TRANSFORM_NAME,
        },
      );
      const source = (link as any).urlSource;
      if (source) {
        (link as any).urlSource = `#${source}`;
      }
    }
    // Change the link into a cross-reference!
    const xref = link as unknown as CrossReference;
    xref.type = 'crossReference';
    xref.identifier = reference.identifier;
    xref.label = reference.label;
    delete xref.kind; // This will be deprecated, no need to set, and remove if it is there
    delete (xref as any).url;
    // Raise a warning if linking to an implicit node.
    if ((target.node as any).implicit && opts.state.file) {
      fileWarn(
        opts.state.file,
        `Linking "${target.node.identifier}" to an implicit ${target.kind} reference, best practice is to create an explicit reference.`,
        {
          node,
          note: 'Explicit references do not break when you update the title to a section, they are preferred over using the implicit HTML ID created for headers.',
          source: TRANSFORM_NAME,
        },
      );
    }
  });
};

/** Cross references cannot contain links, but should retain their content */
function unnestCrossReferencesTransform(tree: GenericParent) {
  const xrefs = selectAll('crossReference', tree) as GenericNode[];
  xrefs.forEach((xref) => {
    const children = xref.children as any;
    if (!children) return;
    const subtree = { type: 'root', children: copyNode(children) } as any;
    const nested = select('crossReference,link', subtree);
    if (!nested) return;
    liftChildren(subtree, 'link');
    liftChildren(subtree, 'crossReference');
    xref.children = subtree.children;
  });
  return tree.children as PhrasingContent[];
}

export const resolveCrossReferencesTransform = (tree: GenericParent, opts: StateOptions) => {
  visit(tree, 'crossReference', (node: CrossReference) => {
    opts.state.resolveReferenceContent(node);
  });
};

export const resolveReferencesTransform = (
  tree: GenericParent,
  file: VFile,
  opts: StateOptions,
) => {
  resolveReferenceLinksTransform(tree, opts);
  resolveCrossReferencesTransform(tree, opts);
  addContainerCaptionNumbersTransform(tree, file, opts);
  unnestCrossReferencesTransform(tree);
};

export const resolveReferencesPlugin: Plugin<[StateOptions], GenericParent, GenericParent> =
  (opts) => (tree, file) => {
    resolveReferencesTransform(tree, file, opts);
  };
