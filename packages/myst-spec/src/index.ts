// Disable eslint shadowing rule, because we need to do this!
/* eslint-disable  @typescript-eslint/no-shadow */
import type { Node } from 'unist';
import type {
  Association,
  BlockContent,
  Content,
  DefinitionContent,
  Image,
  ListContent,
  Literal,
  Parent,
  PhrasingContent,
  Root,
  StaticPhrasingContent,
  Table,
  TopLevelContent as MdastTopLevelContent,
} from 'mdast';
import type { IOutput } from '@jupyterlab/nbformat';

/// Interfaces ///////////////////////
interface HasClass {
  class: string;
}

interface HasAlign {
  align: 'left' | 'center' | 'right';
}

interface HasKey {
  key: string;
}

// All MyST MDAST nodes have these properties
interface BaseInterface extends Partial<Association>, Partial<HasClass>, Partial<HasKey> {}

/**
 * Interface for enumerated MyST content
 */
interface Enumerated {
  /**
   * Count this enumerated object for numbering based on node type, kind, etc.
   */
  enumerated: boolean;
  /**
   * Resolved enumerated value for this enumerated object.
   */
  enumerator: string;
}

/// Types //////////////////////////////
/**
 * Abbreviation node described by title.
 */
interface Abbreviation extends Parent {
  /**
   * Node type of myst abbreviation.
   */
  type: 'abbreviation';
  /**
   * Abbreviated value.
   */
  children: PhrasingContent[];
  /**
   * Advisory information for the abbreviation.
   */
  title?: string;
}

/**
 * Custom title for admonition, replaces kind as title.
 */
interface AdmonitionTitle extends Parent {
  /**
   * Node type of myst admonition title.
   */
  type: 'admonitionTitle';
  /**
   * Admonition title.
   */
  children: PhrasingContent[];
}

/**
 * Admonition node for drawing attention to text, separate from the neighboring content.
 */
interface Admonition extends Parent {
  /**
   * Node type of myst admonition.
   */
  type: 'admonition';
  /**
   * Kind of admonition, to determine styling.
   */
  kind?:
    | 'attention'
    | 'caution'
    | 'danger'
    | 'error'
    | 'hint'
    | 'important'
    | 'note'
    | 'seealso'
    | 'tip'
    | 'warning';
  /**
   * Admonition class info to override kind.
   */
  class?: string;
  /**
   * An optional `admonitionTitle` followed by the admonitions content.
   */
  children: (AdmonitionTitle | FlowContent)[];
}
/**
 * AlgorithmLine is, e.g., a line in an algorithm and can be numbered as well as indented.
 * Otherwise this works the same as a paragraph, ideally with tighter styling.
 * The Line is used in Algorithms (e.g. when parsing from LaTeX)
 */
interface AlgorithmLine extends Parent {
  type: 'algorithmLine';
  indent?: number;
  enumerator?: string;
  children: PhrasingContent[];
}

interface Aside extends Parent {
  type: 'aside';
  kind?: 'sidebar' | 'margin' | 'topic';
  children: FlowContent[];
}

/**
 * Top-level break in the myst document, breaking it into Blocks.
 */
interface BlockBreak extends Node, BaseInterface {
  /**
   * Node type of myst block break.
   */
  type: 'blockBreak';
  /**
   * Block metadata. Conventionally this is a stringified JSON dictionary but it may be any arbitrary string.
   */
  meta?: string;
}

/**
 * Top-level content blocks or cells the myst document, delimited by BlockBreaks.
 */
interface Block extends Parent, Pick<BlockBreak, 'meta'> {
  /**
   * Node type of myst block.
   */
  type: 'block';
  kind?: string;
  /**
   * Top-level children of mdast document.
   */
  children: FlowContent[];
  visibility?: Visibility;
}

interface Cite extends Parent {
  type: 'cite';
  kind: CiteKind;
  label: string;
  identifier?: string;
  error?: boolean | 'not found' | 'rendering error';
  prefix?: string;
  suffix?: string;
  partial?: 'author' | 'year';
  enumerator?: string;
  children: StaticPhrasingContent[];
}

interface CiteGroup extends Parent {
  type: 'citeGroup';
  kind: CiteKind;
  children: Cite[];
}

type CiteKind = 'narrative' | 'parenthetical';

/**
 * Comment nodes for comments present in myst but ignored upon render.
 */
interface Comment extends Literal {
  /**
   * Node type of myst comment.
   */
  type: 'mystComment';
}

/**
 * Caption for container content.
 */
interface Caption extends Parent {
  /**
   * Node type of myst caption.
   */
  type: 'caption';
  children: FlowContent[];
}

interface CaptionNumber extends Literal, Parent {
  type: 'captionNumber';
  kind: string;
  children: PhrasingContent[];
}

/**
 * Top-level container node to provide association and numbering to child content.
 */
interface Container extends Parent, Partial<Enumerated> {
  /**
   * Node type of myst container.
   */
  type: 'container';
  /**
   * Kind of container contents.
   */
  kind: 'figure' | 'table';
  /**
   * Any custom class information.
   */
  class?: string;
  children: (Caption | Legend | Image | Table)[];
}

/**
 * In-line reference to an associated node.
 *
 * Unlike other nodes, we need the association
 */
interface CrossReference extends Pick<Parent, 'children'> {
  /**
   * Node type of myst crossReference.
   */
  type: 'crossReference';
  /**
   * Indicates if the references should be numbered.
   * The inspiration for `kind` was taken from docutils, and is subject to change as we improve the `crossReference` experience.
   */
  kind?: 'eq' | 'numref' | 'ref';
  /**
   * Children of the crossReference, can include text with "%s" or "{number}" and enumerated references will be filled in.
   */
  children: PhrasingContent[];
}

interface DefinitionDescription extends Parent {
  type: 'definitionDescription';
  children: (FlowContent | PhrasingContent)[];
}
interface DefinitionTerm extends Parent {
  type: 'definitionTerm';
  children: PhrasingContent[];
}
interface DefinitionList extends Parent {
  type: 'definitionList';
  children: (DefinitionTerm | DefinitionDescription)[];
}
type Dependency = {
  url?: string;
  slug?: string;
  kind?: SourceFileKind;
  title?: string;
  short_title?: string;
  label?: string;
  location?: string;
  remoteBaseUrl?: string;
};

/**
 * Content block with predefined behavior.
 */
interface Directive extends Parent, Literal {
  /**
   * Node type of myst mystDirective.
   */
  type: 'mystDirective';
  name: string;
  args?: string;
  options?: { [key: string]: unknown };
  /**
   * Parsed directive content.
   */
  children: FlowContent[];
}
interface Embed extends Parent {
  type: 'embed';
  'remove-input'?: boolean;
  'remove-output'?: boolean;
  source?: Dependency;
  children: (FlowContent | ListContent | PhrasingContent)[];
}

interface Iframe extends Parent, Partial<HasAlign>, Partial<HasClass> {
  type: 'iframe';
  src: string;
  width?: string;
  title?: string;
  children: Image[];
}

type IncludeFilter = {
  startAfter?: string;
  startAt?: string;
  endBefore?: string;
  endAt?: string;
  /** Lines start at 1 and can be negative (-1 is the last line). For example, [1, 3, [10]] will select lines 1, 3 and 10 until the end. */
  lines?: (number | [number, number?])[];
};
interface Include extends Parent {
  type: 'include';
  file: string;
  literal?: boolean;
  filter?: IncludeFilter;
  lang?: string;
  showLineNumbers?: boolean;
  /** The `match` will be removed in a transform */
  startingLineNumber?: number | 'match';
  emphasizeLines?: number[];
  filename?: string;
  /** `caption` is temporary, and is used before a transform */
  caption?: (FlowContent | ListContent | PhrasingContent)[];
  children: (FlowContent | ListContent | PhrasingContent)[];
}

interface IndexEntry {
  entry: string;
  subEntry?: {
    value: string;
    kind: SubEntryKind;
  };
  emphasis?: boolean;
}

interface InlineExpression extends Parent, Literal {
  type: 'inlineExpression';
  identifier?: string;
  result?: Record<string, any>;
  children: StaticPhrasingContent[];
}
/**
 * Fragment of math, similar to InlineCode, using role {math}.
 */
interface InlineMath extends Literal {
  /**
   * Node type of myst inlineMath.
   */
  type: 'inlineMath';
  /** Typst-specific math content. If not provided, LaTeX content will be converted to Typst. */
  typst?: string;
}

/**
 * Legend for container content.
 */
interface Legend extends Parent {
  /**
   * Node type of myst legend.
   */
  type: 'legend';
  children: FlowContent[];
}

/**
 * Math node for presenting numbered equations.
 */
interface Math extends Literal, Partial<Enumerated> {
  /**
   * Node type of myst math.
   */
  type: 'math';
  /** Typst-specific math content. If not provided, LaTeX content will be converted to Typst. */
  typst?: string;
  kind?: 'subequation';
  tight?: 'before' | 'after' | boolean;
}

interface MathGroup extends Parent {
  type: 'mathGroup';

  children: Math[];
}
interface Output extends Parent {
  type: 'output';
  jupyter_data: IOutput;
  children: FlowContent[];
}
interface Outputs extends Parent {
  type: 'outputs';
  visibility?: Visibility;
  scroll?: boolean;
  id?: string;
  children: (Output | FlowContent | ListContent | PhrasingContent)[]; // Support placeholders in addition to outputs
}
interface Raw extends Literal, Parent {
  type: 'raw';
  lang?: string;
  tex?: string;
  typst?: string;
  children: (FlowContent | ListContent | PhrasingContent)[];
}

// Custom in-line behavior.
interface Role extends Literal, Parent {
  /**
   * Node type of myst mystRole.
   */
  type: 'mystRole';
  name: string;
  /**
   * Parsed role content.
   */
  children: PhrasingContent[];
}

interface SIUnit extends Literal {
  type: 'si';
  number?: string;
  unit?: string;
  units?: string[];
  alt?: string;
}

interface SmallCaps extends Parent {
  type: 'smallcaps';
  children: PhrasingContent[];
}
enum SourceFileKind {
  Article = 'Article',
  Notebook = 'Notebook',
  Part = 'Part',
}

// Index information for nodes
type SubEntryKind = 'entry' | 'see' | 'seealso';
interface TabItem extends Parent {
  type: 'tabItem';
  title: string;
  sync?: string;
  selected?: boolean;
  children: BlockContent[];
}
interface TabSet extends Parent {
  type: 'tabSet';
  children: TabItem[];
}

/**
 * Target node - provides identifier/label for the following node.
 */
interface Target extends Node, BaseInterface {
  /**
   * Node type of myst mystTarget.
   */
  type: 'mystTarget';
  label?: string;
}

interface Underline extends Parent {
  type: 'underline';
  children: PhrasingContent[];
}
type Visibility = 'show' | 'hide' | 'remove';

declare module 'mdast' {
  // 1. Extend Association to include HTML ID and index entries
  interface Association {
    html_id?: string;
    // Nodes that may be targetted may also have index entries
    indexEntries?: IndexEntry[];
  }
  type Referenceable = Partial<Association>;

  // 2. Make all node types extend Association
  // Make mdast parents associable, and literals
  interface Literal extends BaseInterface {}
  interface Parent extends BaseInterface {}
  // Make non-Parent and non-Literal node types associable. We can't touch Node, because it's not specific to mdast
  // curl -L https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/refs/heads/master/types/mdast/v3/index.d.ts | rg 'export interface (\S+) extends .*(Parent|Literal)'
  interface Definition extends BaseInterface {}
  interface Break extends BaseInterface {}
  interface Image extends BaseInterface {}
  interface ImageReference extends BaseInterface {}
  interface FootnoteReference extends BaseInterface {}
  interface ThematicBreak extends BaseInterface {}

  // 3. Headings and other types can be enumerated, or otherwise extended
  interface Heading extends Partial<Enumerated> {
    implicit?: true;
  }
  interface FootnoteReference extends Partial<Pick<Enumerated, 'enumerator'>> {
    /** @deprecated this should be enumerator */
    number?: number;
  }
  interface FootnoteDefinition extends Partial<Pick<Enumerated, 'enumerator'>> {}
  interface Image {
    urlSource?: string;
    urlOptimized?: string;
    height?: string;
    placeholder?: boolean;
  }
  interface Link {
    urlSource?: string;
    dataUrl?: string;
    internal?: boolean;
    static?: true;
    protocol?: string;
    error?: true;
  }
  interface TableCell {
    colspan?: number;
    rowspan?: number;
    width?: number;
  }

  // 4. Expand set of known types
  // N.B. Static-Phrasing distinction disappears in v4
  /// This interface can be augmented to register custom node types in a phrasing context, including links and link references.
  interface StaticPhrasingContentMap {
    abbreviation: Abbreviation;
    captionNumber: CaptionNumber;
    cite: Cite;
    citeGroup: CiteGroup;
    inlineExpression: InlineExpression;
    inlineMath: InlineMath;
    mystRole: Role;
    si: SIUnit;
    smallCaps: SmallCaps;
    underline: Underline;
  }
  /// This interface can be augmented to register custom node types in a phrasing context, excluding links and link references
  interface PhrasingContentMap {
    crossReference: CrossReference;
  }

  /*
   * The mdast type system makes the following assumptions:
   *
   * The generic Parent node can contain any (all) child node types, so it's the union of all node types.
   * The Root type must be able to contain any node type, so it shares this type.
   *
   * In mdast==3, the set of all node types is defined as the union of types in:
   * `BlockContentMap`, `DefinitionContentMap`, `ListContentMap`, `RowContentMap`, `PhrasingContentMap`, or `StaticPhrasingContentMap`
   * In mdast==4, these union includes an additional `RootContentMap`.
   *
   * In mdast==3, therefore, it's not possible to enforce that type B is only ever a child of type A.
   * In mdast==4, this _is_ possible, except that type B may also appear as a child of the Root node.
   *
   * So, in mdast==4 we can say that top-level only types like `block` are only members of the `RootContentMap`, and
   * `admonitionTitle` is only a member of `RootContentMap` and `Admonition.children`.
   *
   * But, `RootContentMap` doesn't exist in mdast==3, so we'll have to add `block` and `admonitionTitle` to some other mapping like `BlockContentMap`.
   */

  interface RootContentMap {
    // Types that never appear as children except for `Root.children`
    // NB there is also TopLevelContent, but we can't extend it. We'll want to define out own type.
    block: Block;
    blockBreak: BlockBreak;
    // Types that can appear as children of specific nodes.
    admonitionTitle: AdmonitionTitle;
    caption: Caption;
    definitionDescription: DefinitionDescription;
    definitionTerm: DefinitionTerm;
    legend: Legend;
    output: Output;
    outputs: Outputs;
    tabItem: TabItem;
  }

  /// These types are accepted inside block quotes, list items, footnotes, and roots.
  /// RootContent is a useful type description from v4, so we also use it here internally
  /// When we move to v4, we'll remove RootContentMap from here and lift it up
  interface BlockContentMap extends RootContentMap {
    admonition: Admonition;
    algorithmLine: AlgorithmLine;
    aside: Aside;
    container: Container;
    definitionList: DefinitionList;
    embed: Embed;
    iframe: Iframe;
    include: Include;
    math: Math;
    mathGroup: MathGroup;
    mystComment: Comment;
    mystDirective: Directive;
    mystTarget: Target;
    raw: Raw;
    tabSet: TabSet;
  }
}
// Extend this to allow blocks at the top
type TopLevelContent = MdastTopLevelContent | Block;
// Taken from correlating MDAST written spec with types (https://github.com/syntax-tree/mdast/tree/5.0.0?tab=readme-ov-file#flowcontent)
// An verbal-spec-based term that we use, so we'll export.
type FlowContent = BlockContent | DefinitionContent;

type Nodes = Root | Content;
type Parents = Extract<Nodes, Parent>;
type Literals = Extract<Nodes, Literal>;

// Interfaces
export type { Enumerated, HasClass, HasAlign };

// Export overwritten/new node group types
export type { FlowContent, Literals, Nodes, Parents, TopLevelContent };

// Export mdast node type groups
export type {
  Content,
  BlockContent,
  DefinitionContent,
  FrontmatterContent,
  ListContent,
  PhrasingContent,
  StaticPhrasingContent,
  TableContent,
  BlockContentMap,
  DefinitionContentMap,
  FrontmatterContentMap,
  ListContentMap,
  PhrasingContentMap,
  RowContentMap,
  StaticPhrasingContentMap,
  TableContentMap,
} from 'mdast';

// Non-node types
export type { CiteKind, Dependency, IncludeFilter, IndexEntry, SubEntryKind, Visibility };

// Export new nodes and types
export type {
  Abbreviation,
  Admonition,
  AdmonitionTitle,
  AlgorithmLine,
  Aside,
  Block,
  BlockBreak,
  Caption,
  CaptionNumber,
  Cite,
  CiteGroup,
  Comment,
  Container,
  DefinitionDescription,
  DefinitionList,
  DefinitionTerm,
  Directive,
  Embed,
  Iframe,
  Include,
  InlineExpression,
  InlineMath,
  Legend,
  Math,
  MathGroup,
  Output,
  Outputs,
  Raw,
  Role,
  SIUnit,
  /** @deprecated **/
  SIUnit as SiUnit,
  SmallCaps,
  /** @deprecated **/
  SmallCaps as Smallcaps,
  TabItem,
  TabSet,
  Target,
  Underline,
};
// Export core mdast types (that we augment)
export type {
  Blockquote,
  Break,
  Code,
  Definition,
  Delete,
  Emphasis,
  Footnote,
  FootnoteDefinition,
  FootnoteReference,
  HTML,
  Heading,
  Image,
  ImageReference,
  InlineCode,
  Link,
  LinkReference,
  List,
  ListItem,
  Literal,
  Paragraph,
  Parent,
  Root,
  Strong,
  Table,
  TableCell,
  TableRow,
  Text,
  ThematicBreak,
  YAML,
} from 'mdast';

export type { Node } from 'unist';
