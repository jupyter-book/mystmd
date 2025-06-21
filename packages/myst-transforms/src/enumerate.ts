import type { Plugin } from 'unified';
import { VFile } from 'vfile';
import type { CrossReference, Paragraph } from 'myst-spec';
import type { Cite, Container, Heading, Math, MathGroup, Link, IndexEntry } from 'myst-spec-ext';
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
  TargetKind,
  RuleId,
  isTargetIdentifierNode,
} from 'myst-common';
import type { LinkTransformer } from './links/types.js';
import { updateLinkTextIfEmpty } from './links/utils.js';
import { fillNumbering } from 'myst-frontmatter';
import type { PageFrontmatter, Numbering } from 'myst-frontmatter';

const TRANSFORM_NAME = 'myst-transforms:enumerate';

const DEFAULT_NUMBERING: Numbering = {
  equation: { enabled: true, template: '(%s)' },
  subequation: { enabled: true, template: '(%s)' },
  figure: { enabled: true, template: 'Figure %s' },
  subfigure: { enabled: true, template: 'Figure %s' },
  table: { enabled: true, template: 'Table %s' },
  code: { enabled: true, template: 'Program %s' },
  heading_1: { template: 'Section %s' },
  heading_2: { template: 'Section %s' },
  heading_3: { template: 'Section %s' },
  heading_4: { template: 'Section %s' },
  heading_5: { template: 'Section %s' },
  heading_6: { template: 'Section %s' },
};

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

function getDefaultNumberedReferenceTemplate(kind: TargetKind | string) {
  if (kind === 'code') kind = 'program';
  const domain = kind.includes(':') ? kind.split(':')[1] : kind;
  // eslint-disable-next-line no-irregular-whitespace
  return `${domain.slice(0, 1).toUpperCase()}${domain.slice(1)} %s`;
}

function getDefaultNamedReferenceTemplate(
  kind: TargetKind | string = 'unknown',
  hasTitle: boolean,
) {
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

function getReferenceTemplate(
  target: Target,
  numbering: Numbering,
  numbered: boolean,
  hasTitle: boolean,
  offset?: number,
) {
  const { kind, node } = target;
  let template: string | undefined;
  if (numbered) {
    if (kind === TargetKind.heading && node.type === 'heading') {
      template =
        numbering[`heading_${node.depth - (numbering?.title?.enabled ? 0 : 1) + (offset ?? 0)}`]
          ?.template;
    } else if (node.subcontainer) {
      template = numbering.subfigure?.template;
    } else {
      template = numbering[kind]?.template;
    }
    return template ?? getDefaultNumberedReferenceTemplate(kind);
  }
  return getDefaultNamedReferenceTemplate(kind, hasTitle);
}

export enum ReferenceKind {
  ref = 'ref',
  numref = 'numref',
  eq = 'eq',
}

type TargetNodes = (Container | Math | MathGroup | Heading) & {
  html_id: string;
  subcontainer?: boolean;
  parentEnumerator?: string;
  indexEntries?: IndexEntry[];
};

export type Target = {
  node: TargetNodes;
  kind: TargetKind | string;
};

export type TargetCounts = {
  heading: (number | null)[];
} & Record<string, { main: number; sub: number }>;

export type StateOptions = {
  state: ReferenceState;
  hidden?: boolean;
};

export type StateResolverOptions = {
  state: IReferenceStateResolver;
  transformers?: LinkTransformer[];
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
  target?: TargetNodes,
  title?: string | PhrasingContent[],
) {
  const noNodeChildren = !node.children?.length;
  if (noNodeChildren) {
    setTextAsChild(node, template);
  }
  const num =
    target?.enumerator != null
      ? `${target.parentEnumerator ?? ''}${target.enumerator}`
      : UNKNOWN_REFERENCE_ENUMERATOR;
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
    '{subEnumerator}': () => {
      used.number = true;
      return target?.enumerator ?? UNKNOWN_REFERENCE_ENUMERATOR;
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
        ruleId: RuleId.referenceTemplateFills,
      },
    );
  }
}

function kindFromNode(node: TargetNodes): TargetKind | string {
  if (node.type === 'container') return node.kind || TargetKind.figure;
  if (node.type === 'math' && node.kind === 'subequation') return TargetKind.subequation;
  if (node.type === 'math' || node.type === 'mathGroup') return TargetKind.equation;
  if ((node as any).kind) return `${node.type}:${(node as any).kind}`;
  return node.type;
}

function shouldEnumerateNode(
  node: TargetNodes,
  kind: TargetKind | string,
  numbering: Numbering,
  offset?: number,
): boolean {
  // Node may override enumeration from numbering frontmatter
  if (node.enumerated != null) return node.enumerated;
  const enabledDefault = numbering.all?.enabled ?? false;
  if (kind === 'heading' && node.type === 'heading') {
    return (
      numbering[`heading_${node.depth - (numbering?.title?.enabled ? 0 : 1) + (offset ?? 0)}`]
        ?.enabled ?? enabledDefault
    );
  }
  if (node.subcontainer) return numbering.subfigure?.enabled ?? enabledDefault;
  return numbering[kind]?.enabled ?? enabledDefault;
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

export function initializeTargetCounts(
  numbering: Numbering,
  previousCounts?: TargetCounts,
  offset?: number,
): TargetCounts {
  const heading = [1, 2, 3, 4, 5, 6].map((depth, ind) => {
    const cont = numbering[`heading_${depth}`]?.continue ?? numbering.all?.continue ?? false;
    const enabled = numbering[`heading_${depth}`]?.enabled ?? numbering.all?.enabled ?? true;
    const prevCount = previousCounts?.heading?.[ind];
    if (cont && enabled && prevCount !== undefined) {
      return prevCount;
    }
    if (numbering.title?.enabled && depth - 1 <= (offset ?? 0) && prevCount != null) {
      return prevCount;
    }
    if (!numbering.title?.enabled && depth <= (offset ?? 0)) {
      return null;
    }
    return 0;
  });

  const targetCounts = { heading } as TargetCounts;
  // Update with other initial values
  Object.entries(previousCounts ?? {})
    .filter(([key]) => key !== 'heading')
    .filter(([key]) => numbering[key]?.continue || numbering.all?.continue)
    .forEach(([key, val]) => {
      targetCounts[key] = { ...(val as { main: number; sub: number }) };
    });
  // Set the offset counts if the numbering defines start
  // These start values take priority over the initialCounts
  Object.entries(numbering).forEach(([key, val]) => {
    if (
      ['heading_1', 'heading_2', 'heading_3', 'heading_4', 'heading_5', 'heading_6'].includes(key)
    ) {
      const headingIndex = Number.parseInt(key.slice(-1), 10) - 1;
      if (val.enabled === false) {
        targetCounts.heading[headingIndex] = null;
      } else if (val.start) {
        targetCounts.heading[headingIndex] = val.start - 1;
      }
    } else if (val.start) {
      targetCounts[key] = { main: val.start - 1, sub: 0 };
    }
  });
  return targetCounts;
}

export interface IReferenceStateResolver {
  vfile: VFile;
  /**
   * If the page is provided, it will only look at that page.
   */
  getTarget: (identifier?: string, page?: string) => Target | undefined;
  getAllTargets: () => Target[];
  getFileTarget: (identifier?: string) => ReferenceState | undefined;
  getIdentifiers: () => string[];
  resolveReferenceContent: (node: ResolvableCrossReference) => void;
  resolveStateProvider: (identifier?: string, page?: string) => ReferenceState | undefined;
}

export class ReferenceState implements IReferenceStateResolver {
  vfile: VFile;
  filePath: string;
  url?: string;
  title?: string;
  dataUrl?: string;
  numbering: Numbering;
  targets: Record<string, Target>;
  targetCounts: TargetCounts;
  identifiers: string[];
  enumerator?: string;
  offset: number;

  constructor(
    filePath: string,
    opts?: {
      frontmatter?: PageFrontmatter;
      url?: string;
      dataUrl?: string;
      previousCounts?: TargetCounts;
      identifiers?: string[];
      vfile: VFile;
      hidden?: boolean;
    },
  ) {
    this.numbering = fillNumbering(opts?.frontmatter?.numbering, DEFAULT_NUMBERING);
    this.offset = this.numbering?.title?.offset ?? 0;
    this.targetCounts = initializeTargetCounts(this.numbering, opts?.previousCounts, this.offset);
    if (
      !opts?.hidden &&
      (this.numbering.title?.enabled || this.numbering.all?.enabled) &&
      !opts?.frontmatter?.content_includes_title &&
      this.numbering[`heading_${this.offset + 1}`]?.enabled !== false
    ) {
      this.targetCounts.heading = incrementHeadingCounts(
        this.offset + 1,
        this.targetCounts.heading,
      );
      this.enumerator = formatHeadingEnumerator(
        this.targetCounts.heading,
        this.numbering.title?.enumerator ?? this.numbering.enumerator?.enumerator,
      );
    }
    this.identifiers = opts?.identifiers ?? [];
    this.targets = {};
    this.vfile = opts?.vfile ?? new VFile();
    this.filePath = filePath;
    this.url = opts?.url;
    this.dataUrl = opts?.dataUrl;
    this.title = opts?.frontmatter?.title;
  }

  addTarget(node: TargetNodes, hidden?: boolean) {
    if (!isTargetIdentifierNode(node)) return;
    const kind = kindFromNode(node);
    const numberNode = !hidden && shouldEnumerateNode(node, kind, this.numbering, this.offset);
    if (numberNode) {
      this.incrementCount(node, kind as TargetKind);
    }
    if (!(node as any).html_id) {
      (node as any).html_id = createHtmlId(node.identifier);
    }
    if (!node.identifier) return;
    if (this.targets[node.identifier] || this.identifiers.includes(node.identifier)) {
      if (!this.vfile) return;
      if ((node as any).implicit) return; // Do not warn on implicit headings
      fileWarn(this.vfile, `Duplicate identifier in file "${node.identifier}"`, {
        node,
        source: TRANSFORM_NAME,
        ruleId: RuleId.identifierIsUnique,
      });
      return;
    }
    this.targets[node.identifier] = {
      node,
      kind: kind as TargetKind,
    };
  }

  resolveEnumerator(val: any, enumerator?: string): string {
    const prefix = enumerator ?? this.numbering.enumerator?.enumerator;
    return prefix ? prefix.replace(/%s/g, String(val)) : String(val);
  }

  /**
   * Increment target count state for container/equation nodes
   *
   * Updates node `enumerator` in place.
   *
   * If node is subcontainer/subequation, a sub-count is incremented
   */
  incrementCount(node: TargetNodes, kind: TargetKind | string): string {
    if (node.enumerator) {
      // If the enumerator is explicitly defined, return early
      // This is the case if the figure, for example, has an enumerator set (e.g. `2a`)
      // The other numbering will not be affected, and may be wrong
      return node.enumerator;
    }
    let enumerator: string | number;
    if (kind === TargetKind.heading && node.type === 'heading') {
      this.targetCounts.heading = incrementHeadingCounts(
        node.depth - (this.numbering?.title?.enabled ? 0 : 1) + this.offset,
        this.targetCounts.heading,
      );
      enumerator = formatHeadingEnumerator(
        this.targetCounts.heading,
        this.numbering[
          `heading_${node.depth - (this.numbering?.title?.enabled ? 0 : 1) + this.offset}`
        ]?.enumerator ?? this.numbering.enumerator?.enumerator,
      );
      node.enumerator = enumerator;
      return enumerator;
    }
    const countKind = kind === TargetKind.subequation ? TargetKind.equation : kind;
    // Ensure target kind is instantiated
    this.targetCounts[countKind] ??= { main: 0, sub: 0 };
    if (node.subcontainer || kind === TargetKind.subequation) {
      this.targetCounts[countKind].sub += 1;
      // Will restart counting if there are more than 26 subequations/figures
      const letter = String.fromCharCode(
        ((this.targetCounts[countKind].sub - 1) % 26) + 'a'.charCodeAt(0),
      );
      if (node.subcontainer) {
        node.parentEnumerator = this.resolveEnumerator(
          this.targetCounts[countKind].main,
          this.numbering[countKind]?.enumerator,
        );
        enumerator = letter;
      } else {
        enumerator = this.resolveEnumerator(
          this.targetCounts[countKind].main + letter,
          this.numbering[countKind]?.enumerator,
        );
      }
    } else {
      this.targetCounts[kind].main += 1;
      this.targetCounts[kind].sub = 0;
      enumerator = this.resolveEnumerator(
        this.targetCounts[kind].main,
        this.numbering[kind]?.enumerator,
      );
    }
    node.enumerator = enumerator;
    return enumerator;
  }

  resolveStateProvider(identifier?: string, page?: string): ReferenceState | undefined {
    if (!identifier || !page || page !== this.filePath) return;
    if (this.getTarget(identifier) || this.getFileTarget(identifier)) return this;
  }

  getIdentifiers() {
    return [...this.identifiers, ...Object.keys(this.targets)];
  }

  getTarget(identifier?: string): Target | undefined {
    if (!identifier) return undefined;
    return this.targets[identifier];
  }

  getAllTargets(): Target[] {
    return [...Object.values(this.targets)];
  }

  getFileTarget(identifier?: string): ReferenceState | undefined {
    if (!identifier) return undefined;
    if (this.identifiers.includes(identifier)) return this;
  }

  resolveReferenceContent(node: ResolvableCrossReference) {
    const fileTarget = this.getFileTarget(node.identifier);
    if (fileTarget) {
      const { url, title, dataUrl } = fileTarget;
      if (url) {
        const nodeAsLink = node as unknown as Link;
        nodeAsLink.type = 'link';
        nodeAsLink.url = url;
        nodeAsLink.internal = true;
        if (dataUrl) nodeAsLink.dataUrl = dataUrl;
        updateLinkTextIfEmpty(nodeAsLink, title ?? url);
      }
      return;
    }
    const target = this.getTarget(node.identifier);
    if (!target) {
      warnNodeTargetNotFound(node, this.vfile);
      return;
    }
    // Put the kind on the node so we can use that later
    node.kind = target.kind;
    addChildrenFromTargetNode(node, target.node, this.numbering, this.vfile, this.offset);
  }
}

export function addChildrenFromTargetNode(
  node: ResolvableCrossReference,
  targetNode: TargetNodes,
  numbering?: Numbering,
  vfile?: VFile,
  offset?: number,
) {
  numbering = fillNumbering(numbering, DEFAULT_NUMBERING);
  const kind = kindFromNode(targetNode);
  const noNodeChildren = !node.children?.length;
  if (kind === TargetKind.heading) {
    const numberHeading = shouldEnumerateNode(targetNode, TargetKind.heading, numbering);
    const template = getReferenceTemplate(
      { node: targetNode, kind },
      numbering,
      numberHeading,
      true,
      offset,
    );
    fillReferenceEnumerators(
      vfile,
      node,
      template,
      targetNode,
      copyNode(targetNode as Heading).children as PhrasingContent[],
    );
  } else {
    // By default look into the caption or admonition title if it exists
    const caption =
      select('caption', targetNode) ||
      select('admonitionTitle', targetNode) ||
      select('definitionTerm', targetNode);
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
    const template = getReferenceTemplate(
      { node: targetNode, kind },
      numbering,
      !!targetNode.enumerator,
      !!title,
      offset,
    );
    fillReferenceEnumerators(vfile, node, template, targetNode, title);
  }
  node.resolved = true;
  // The identifier may have changed in the lookup, but unlikely
  node.identifier = targetNode.identifier ?? node.identifier;
  node.html_id = targetNode.html_id ?? node.html_id;
}

function warnNodeTargetNotFound(node: ResolvableCrossReference, vfile?: VFile) {
  if (!vfile) return;
  fileWarn(vfile, `Cross reference target was not found: ${node.identifier}`, {
    node,
    source: TRANSFORM_NAME,
    ruleId: RuleId.referenceTargetResolves,
  });
}

export class MultiPageReferenceResolver implements IReferenceStateResolver {
  states: ReferenceState[];
  filePath: string; // Path of the current file we are resolving references against
  vfile: VFile; // VFile for reporting errors/warnings

  constructor(states: ReferenceState[], filePath: string, vfile = new VFile()) {
    this.states = states;
    this.filePath = filePath;
    this.vfile = vfile;
  }

  resolveStateProvider(identifier?: string, page?: string): ReferenceState | undefined {
    if (!identifier) return undefined;
    const resolvedState = this.states.find((state) => {
      if (page && page !== state.filePath) return false;
      return !!state.getTarget(identifier) || !!state.getFileTarget(identifier);
    });
    return resolvedState;
  }

  getIdentifiers() {
    return this.states.map((state) => state.getIdentifiers()).flat();
  }

  getTarget(identifier?: string, page?: string): Target | undefined {
    const state = this.resolveStateProvider(identifier, page);
    return state?.getTarget(identifier);
  }

  getAllTargets(): Target[] {
    return this.states.map((state) => state.getAllTargets()).flat();
  }

  getFileTarget(identifier?: string): ReferenceState | undefined {
    if (!identifier) return undefined;
    return this.states.map((state) => state.getFileTarget(identifier)).find((file) => !!file);
  }

  resolveReferenceContent(node: ResolvableCrossReference) {
    const state = this.resolveStateProvider(node.identifier);
    if (!state) {
      warnNodeTargetNotFound(node, this.vfile);
      return;
    }
    state?.resolveReferenceContent(node);
    if (node.resolved && state?.filePath !== this.filePath) {
      node.remote = true;
      node.url = state.url || undefined;
      node.dataUrl = state.dataUrl || undefined;
    }
  }
}

export const enumerateTargetsTransform = (tree: GenericParent, opts: StateOptions) => {
  visit(tree, (node) => {
    if (!isTargetIdentifierNode(node)) return;
    if (
      node.identifier ||
      node.enumerated ||
      ['container', 'mathGroup', 'math', 'heading', 'proof'].includes(node.type)
    ) {
      opts.state.addTarget(node as TargetNodes, opts?.hidden);
    }
  });
  // Add implicit labels to subfigures without explicit labels
  // This must happen after initial enumeration, as implicit subfigure labels are dependent on enumerators
  (selectAll('container', tree) as Container[])
    .filter((container: Container) => !container.subcontainer)
    .forEach((parent) => {
      (selectAll('container[subcontainer]', parent) as Container[]).forEach((sub) => {
        const parentLabel = parent.label ?? parent.identifier;
        if (sub.identifier || !parentLabel || !sub.enumerator) return;
        const { label, identifier } = normalizeLabel(`${parentLabel}-${sub.enumerator}`) ?? {};
        sub.label = label;
        sub.identifier = identifier;
        (sub as any).implicit = true;
        // This is the second time addTarget is called on this node.
        // The first time, it was given an enumerator but not added to targets.
        // This time, it is added to targets since it now has an identifier.
        opts.state.addTarget(sub as TargetNodes, opts?.hidden);
      });
    });
  return tree;
};

export const enumerateTargetsPlugin: Plugin<[StateOptions], GenericParent, GenericParent> =
  (opts) => (tree) => {
    enumerateTargetsTransform(tree, opts);
  };

function getCaptionLabel(kind?: Container['kind'], subcontainer?: boolean) {
  if (subcontainer && (kind === 'equation' || kind === 'subequation')) return `(%s)`;
  if (subcontainer) return `({subEnumerator})`;
  if (!kind) return 'Figure %s:';
  const template = getDefaultNumberedReferenceTemplate(kind);
  return `${template}:`;
}

/** Visit all containers and add captionNumber node to caption paragraph
 *
 * Requires container to be enumerated.
 *
 * By default, captionNumber is only added if caption already exists.
 * However, for sub-containers, captionNumber is always added.
 */
export function addContainerCaptionNumbersTransform(
  tree: GenericParent,
  file: VFile,
  opts: StateResolverOptions,
) {
  const containers = selectAll('container', tree) as Container[];
  containers
    .filter((container: Container) => container.enumerator)
    .forEach((container: Container) => {
      const target = opts.state.getTarget(container.identifier)?.node;
      if (!target?.enumerator) return;
      // Only look for direct caption children
      let para = select(
        'paragraph',
        container.children.find((child) => child.type === 'caption'),
      ) as GenericParent;
      // Always add subcontainer caption number, even if there is no other caption
      if (container.subcontainer && !para) {
        para = { type: 'paragraph', children: [] };
        container.children.push({ type: 'caption', children: [para] } as GenericNode);
      }
      if (para && (para.children[0]?.type as string) === 'captionNumber') {
        para.children = para.children.slice(1);
      }
      if (para) {
        const captionNumber = {
          type: 'captionNumber',
          kind: container.kind,
          label: container.label,
          identifier: container.identifier,
          html_id: (container as any).html_id,
          enumerator: target.enumerator,
        };
        fillReferenceEnumerators(
          file,
          captionNumber,
          getCaptionLabel(container.kind, container.subcontainer),
          target,
        );
        // The caption number is in the paragraph, it needs a link to the figure container
        // This is a bit awkward, but necessary for (efficient) rendering
        para.children = [captionNumber as any, ...(para?.children ?? [])];
      }
    });
}

/**
 * Raise a warning if `target` linked by `node` has an implicit reference
 */
function implicitTargetWarning(target: Target, node: GenericNode, opts: StateResolverOptions) {
  // suppressImplicitWarning is used, for example, in the table of contents directive
  if ((target.node as GenericNode).implicit && opts.state.vfile && !node.suppressImplicitWarning) {
    fileWarn(
      opts.state.vfile,
      `Linking "${target.node.identifier}" to an implicit ${target.kind} reference, best practice is to create an explicit reference.`,
      {
        node,
        note: 'Explicit references do not break when you update the title to a section, they are preferred over using the implicit HTML ID created for headers.',
        source: TRANSFORM_NAME,
        ruleId: RuleId.referenceTargetExplicit,
      },
    );
  }
  delete node.suppressImplicitWarning;
}

export const resolveReferenceLinksTransform = (tree: GenericParent, opts: StateResolverOptions) => {
  selectAll('link', tree).forEach((node) => {
    const link = node as Link;
    const identifier = link.url.replace(/^#/, '');
    const reference = normalizeLabel(identifier);
    const target = opts.state.getTarget(identifier) ?? opts.state.getTarget(reference?.identifier);
    const fileTarget = opts.state.getFileTarget(reference?.identifier);
    if (!(target || fileTarget) || !reference) {
      if (!opts.state.vfile || !link.url.startsWith('#')) return;
      // Only warn on explicit internal URLs
      fileWarn(opts.state.vfile, `No target for internal reference "${link.url}" was found.`, {
        node,
        source: TRANSFORM_NAME,
        ruleId: RuleId.referenceTargetResolves,
      });
      return;
    }
    if (!link.url.startsWith('#') && opts.state.vfile) {
      fileWarn(
        opts.state.vfile,
        `Legacy syntax used for link target, please prepend a '#' to your link url: "${link.url}"`,
        {
          node,
          note: 'The link target should be of the form `[](#target)`, including the `#` sign.\nThis may be deprecated in the future.',
          source: TRANSFORM_NAME,
          ruleId: RuleId.referenceSyntaxValid,
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
    if (target) implicitTargetWarning(target, node, opts);
  });
};

export const resolveUnlinkedCitations = (tree: GenericParent, opts: StateResolverOptions) => {
  selectAll('cite', tree).forEach((node) => {
    const cite = node as Cite;
    if (!cite.error) return;
    const reference = normalizeLabel(cite.label);
    if (reference) {
      const target = opts.state.getTarget(cite.label) ?? opts.state.getTarget(reference.identifier);
      const fileTarget = opts.state.getFileTarget(reference.identifier);
      if (target || fileTarget) {
        // Change the cite into a cross-reference!
        const xref = cite as unknown as CrossReference;
        xref.type = 'crossReference';
        xref.identifier = reference.identifier;
        xref.label = reference.label;
        delete cite.error;
        if (target) implicitTargetWarning(target, node, opts);
        return;
      }
    }
    const transformer = opts.transformers?.find((t) => t.test(cite.label));
    if (transformer) {
      // Change the cite into a link for LinkTransformer to handle later
      const link = cite as unknown as Link;
      link.type = 'link';
      link.url = cite.label;
      delete cite.error;
      return;
    }
    if (!opts.state.vfile) return;
    fileWarn(opts.state.vfile, `Could not link citation with label "${cite.label}".`, {
      node,
      source: TRANSFORM_NAME,
      ruleId: RuleId.referenceTargetResolves,
    });
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

export const resolveCrossReferencesTransform = (
  tree: GenericParent,
  opts: StateResolverOptions,
) => {
  visit(tree, 'crossReference', (node: CrossReference) => {
    // If protocol is set, this came from a LinkTransformer and will not be touched here
    const { protocol } = node as any;
    if (protocol && protocol !== 'file') return;
    opts.state.resolveReferenceContent(node);
  });
};

export const resolveLinksAndCitationsTransform = (
  tree: GenericParent,
  opts: StateResolverOptions,
) => {
  resolveReferenceLinksTransform(tree, opts);
  resolveUnlinkedCitations(tree, opts);
};

export const resolveReferencesTransform = (
  tree: GenericParent,
  file: VFile,
  opts: StateResolverOptions,
) => {
  resolveCrossReferencesTransform(tree, opts);
  addContainerCaptionNumbersTransform(tree, file, opts);
  unnestCrossReferencesTransform(tree);
};

export const resolveReferencesPlugin: Plugin<
  [StateResolverOptions],
  GenericParent,
  GenericParent
> = (opts) => (tree, file) => {
  resolveLinksAndCitationsTransform(tree, opts);
  resolveReferencesTransform(tree, file, opts);
};
