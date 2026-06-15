/**
 * Myst syntax tree built on existing mdast schemas
 */
export type Root = {
  type?: 'root';
  /**
   * Top-level children of myst document
   */
  children?: (Block | BlockBreak | FlowContent)[] | ListContent[] | PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent26;
/**
 * Top-level content blocks or cells the myst document, delimited by BlockBreaks
 */
export type Block = {
  type?: 'block';
  /**
   * block metadata from preceding break; conventionally, a stringified JSON dictionary but may be any arbitrary string
   */
  meta?: string;
  /**
   * Top-level children of myst document
   */
  children?: FlowContent[] | ListContent[] | PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Node14;
export type FlowContent =
  | Paragraph
  | Definition
  | Heading
  | ThematicBreak
  | Blockquote
  | List
  | HTML
  | Code
  | Comment
  | Target
  | Directive
  | Admonition
  | Container
  | Math
  | Table
  | FootnoteDefinition;
export type Paragraph = {
  type?: 'paragraph';
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent13;
export type PhrasingContent =
  | StaticPhrasingContent
  | Emphasis
  | Strong
  | Link
  | LinkReference
  | Subscript
  | Superscript
  | Underline
  | Abbreviation
  | CrossReference
  | FootnoteReference;
export type StaticPhrasingContent =
  | Text
  | HTML
  | EmphasisStatic
  | StrongStatic
  | InlineCode
  | Break
  | Image
  | ImageReference
  | Role
  | SubscriptStatic
  | SuperscriptStatic
  | UnderlineStatic
  | InlineMath;
export type Text = {
  type?: 'text';
  value?: unknown;
  position?: unknown;
  data?: unknown;
} & Literal;
/**
 * Basic node with required string value
 */
export type Literal = {
  /**
   * The value of the node
   */
  value: string;
} & Node;
/**
 * Fragment of raw HTML - does not need to be valid or complete
 */
export type HTML = {
  type?: 'html';
  value?: unknown;
  position?: unknown;
  data?: unknown;
} & Literal1;
/**
 * Basic node with required string value
 */
export type Literal1 = {
  /**
   * The value of the node
   */
  value: string;
} & Node;
/**
 * Stressed, italicized content, with static children; used when parent node requires static content
 */
export type EmphasisStatic = {
  type?: 'emphasis';
  children?: StaticPhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent;
/**
 * Basic node with required node children
 */
export type Parent = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Important, serious, urgent, bold content, with static children; used when parent node requires static content
 */
export type StrongStatic = {
  type?: 'strong';
  children?: StaticPhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent1;
/**
 * Basic node with required node children
 */
export type Parent1 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Fragment of code
 */
export type InlineCode = {
  type?: 'inlineCode';
  value?: unknown;
  position?: unknown;
  data?: unknown;
} & Literal2;
/**
 * Basic node with required string value
 */
export type Literal2 = {
  /**
   * The value of the node
   */
  value: string;
} & Node;
/**
 * Line break
 */
export type Break = {
  type?: 'break';
  position?: unknown;
  data?: unknown;
} & Node3;
/**
 * Image hyperlink
 */
export type Image = {
  type?: 'image';
  /**
   * user-defined class for image
   */
  class?: string;
  /**
   * image width in pixels or percentage
   */
  width?: string;
  align?: 'left' | 'center' | 'right';
  url?: unknown;
  title?: unknown;
  alt?: unknown;
  position?: unknown;
  data?: unknown;
} & Resource &
  Alternative &
  Node4;
/**
 * Image through association
 */
export type ImageReference = {
  type?: 'imageReference';
  referenceType?: unknown;
  identifier?: unknown;
  label?: unknown;
  alt?: unknown;
  position?: unknown;
  data?: unknown;
} & Reference &
  Association &
  Alternative1 &
  Node5;
/**
 * Internal relation from one node to another
 */
export type Association = {
  identifier: unknown;
} & OptionalAssociation;
/**
 * Custom in-line behavior
 */
export type Role = {
  type?: 'mystRole';
  name: string;
  /**
   * content of the directive
   */
  value?: string;
  /**
   * parsed role content
   */
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Node6;
/**
 * Subscript content, with static children; used when parent node requires static content
 */
export type SubscriptStatic = {
  type?: 'subscript';
  children?: StaticPhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent2;
/**
 * Basic node with required node children
 */
export type Parent2 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Superscript content, with static children; used when parent node requires static content
 */
export type SuperscriptStatic = {
  type?: 'superscript';
  children?: StaticPhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent3;
/**
 * Basic node with required node children
 */
export type Parent3 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Underline content, with static children; used when parent node requires static content
 */
export type UnderlineStatic = {
  type?: 'underline';
  children?: StaticPhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent4;
/**
 * Basic node with required node children
 */
export type Parent4 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Fragment of math, similar to InlineCode, using role {math}
 */
export type InlineMath = {
  type?: 'inlineMath';
  value?: unknown;
  position?: unknown;
  data?: unknown;
} & Literal3;
/**
 * Basic node with required string value
 */
export type Literal3 = {
  /**
   * The value of the node
   */
  value: string;
} & Node;
/**
 * Stressed, italicized content
 */
export type Emphasis = {
  type?: 'emphasis';
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent5;
/**
 * Basic node with required node children
 */
export type Parent5 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Important, serious, urgent, bold content
 */
export type Strong = {
  type?: 'strong';
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent6;
/**
 * Basic node with required node children
 */
export type Parent6 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Hyperlink
 */
export type Link = {
  type?: 'link';
  children?: StaticPhrasingContent[];
  url?: unknown;
  title?: unknown;
  position?: unknown;
  data?: unknown;
} & Resource1 &
  Parent7;
/**
 * Basic node with required node children
 */
export type Parent7 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Hyperlink through association
 */
export type LinkReference = {
  type?: 'linkReference';
  children?: StaticPhrasingContent[];
  referenceType?: unknown;
  identifier?: unknown;
  label?: unknown;
  position?: unknown;
  data?: unknown;
} & Reference1 &
  Association1 &
  Parent8;
/**
 * Internal relation from one node to another
 */
export type Association1 = {
  identifier: unknown;
} & OptionalAssociation;
/**
 * Basic node with required node children
 */
export type Parent8 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Subscript content, using role {subscript}
 */
export type Subscript = {
  type?: 'subscript';
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent9;
/**
 * Basic node with required node children
 */
export type Parent9 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Superscript content, using role {superscript}
 */
export type Superscript = {
  type?: 'superscript';
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent10;
/**
 * Basic node with required node children
 */
export type Parent10 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Underline content, using role {underline}
 */
export type Underline = {
  type?: 'underline';
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent11;
/**
 * Basic node with required node children
 */
export type Parent11 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Abbreviation node described by title
 */
export type Abbreviation = {
  type?: 'abbreviation';
  /**
   * abbreviated value
   */
  children?: StaticPhrasingContent[];
  /**
   * advisory information for the abbreviation
   */
  title?: string;
  position?: unknown;
  data?: unknown;
} & Parent12;
/**
 * Basic node with required node children
 */
export type Parent12 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * In-line reference to an associated node
 */
export type CrossReference = {
  type?: 'crossReference';
  /**
   * Indicates if the references should be numbered.
   * ```{warning}
   * The `kind` was based on docutils and is subject to change as we improve the `crossReference` experience.
   * ```
   */
  kind?: 'eq' | 'numref' | 'ref';
  /**
   * Children of the crossReference, can include text with "%s" or "{number}" and enumerated references will be filled in.
   */
  children?: StaticPhrasingContent[];
  identifier?: unknown;
  label?: unknown;
  position?: unknown;
  data?: unknown;
} & Association2 &
  Node7;
/**
 * Internal relation from one node to another
 */
export type Association2 = {
  identifier: unknown;
} & OptionalAssociation;
/**
 * Inline reference to footnote
 */
export type FootnoteReference = {
  type?: 'footnoteReference';
  identifier?: unknown;
  label?: unknown;
  position?: unknown;
  data?: unknown;
} & Association3 &
  Node8;
/**
 * Internal relation from one node to another
 */
export type Association3 = {
  identifier: unknown;
} & OptionalAssociation;
/**
 * Basic node with required node children
 */
export type Parent13 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Reference to a url resource
 */
export type Definition = {
  type?: 'definition';
  identifier?: unknown;
  label?: unknown;
  url?: unknown;
  title?: unknown;
  position?: unknown;
  data?: unknown;
} & Association4 &
  Resource2 &
  Node9;
/**
 * Internal relation from one node to another
 */
export type Association4 = {
  identifier: unknown;
} & OptionalAssociation;
export type Heading = {
  type?: 'heading';
  depth: number;
  /**
   * count this heading for numbering based on kind, e.g. Section 2.4.1
   */
  enumerated?: boolean;
  /**
   * resolved enumerated value for this heading
   */
  enumerator?: string;
  children?: PhrasingContent[];
  identifier?: unknown;
  label?: unknown;
  position?: unknown;
  data?: unknown;
} & Parent14 &
  OptionalAssociation1;
/**
 * Basic node with required node children
 */
export type Parent14 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
export type ThematicBreak = {
  type?: 'thematicBreak';
  position?: unknown;
  data?: unknown;
} & Node10;
export type Blockquote = {
  type?: 'blockquote';
  children?: FlowContent[];
  position?: unknown;
  data?: unknown;
} & Parent15;
/**
 * Basic node with required node children
 */
export type Parent15 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
export type List = {
  type?: 'list';
  /**
   * Is item order important or not?
   */
  ordered?: boolean;
  /**
   * Starting number of ordered list
   */
  start?: number;
  /**
   * One or more children are separated with a blank line from others
   */
  spread?: boolean;
  children?: ListContent[];
  position?: unknown;
  data?: unknown;
} & Parent17;
export type ListContent = ListItem;
export type ListItem = {
  type?: 'listItem';
  /**
   * One or more children are separated with a blank line from others
   */
  spread?: boolean;
  children?: (PhrasingContent | FlowContent)[];
  position?: unknown;
  data?: unknown;
} & Parent16;
/**
 * Basic node with required node children
 */
export type Parent16 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Basic node with required node children
 */
export type Parent17 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Block of preformatted text
 */
export type Code = {
  type?: 'code';
  /**
   * language of the code
   */
  lang?: string;
  /**
   * custom information relating to the node
   */
  meta?: string;
  /**
   * user-defined class for code block
   */
  class?: string;
  showLineNumbers?: boolean;
  startingLineNumber?: number;
  emphasizeLines?: number[];
  identifier?: unknown;
  label?: unknown;
  value?: unknown;
  position?: unknown;
  data?: unknown;
} & {} & OptionalAssociation2 &
  Literal4;
/**
 * Basic node with required string value
 */
export type Literal4 = {
  /**
   * The value of the node
   */
  value: string;
} & Node;
/**
 * Comment nodes for comments present in myst but ignored upon render
 */
export type Comment = {
  type?: 'mystComment';
  value?: unknown;
  position?: unknown;
  data?: unknown;
} & Literal5;
/**
 * Basic node with required string value
 */
export type Literal5 = {
  /**
   * The value of the node
   */
  value: string;
} & Node;
/**
 * Target node - provides identifier/label for the following node
 */
export type Target = {
  type?: 'mystTarget';
  /**
   * unresolved target label
   */
  label?: string;
  position?: unknown;
  data?: unknown;
} & Node11;
/**
 * Content block with predefined behavior
 */
export type Directive = {
  type?: 'mystDirective';
  name: string;
  args?: string;
  options?: {
    [k: string]: unknown;
  };
  /**
   * body of the directive, excluding options
   */
  value?: string;
  /**
   * parsed directive content
   */
  children?: (FlowContent | PhrasingContent)[];
  position?: unknown;
  data?: unknown;
} & Node12;
/**
 * Admonition node for drawing attention to text, separate from the neighboring content
 */
export type Admonition = {
  type?: 'admonition';
  /**
   * kind of admonition, to determine styling
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
   * admonition class info to override kind
   */
  class?: string;
  /**
   * An optional `admonitionTitle` followed by the admonitions content.
   */
  children?: (AdmonitionTitle | FlowContent)[];
  position?: unknown;
  data?: unknown;
} & Node13;
/**
 * Custom title for admonition, replaces kind as title
 */
export type AdmonitionTitle = {
  type?: 'admonitionTitle';
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent18;
/**
 * Basic node with required node children
 */
export type Parent18 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Top-level container node to provide association and numbering to child content
 */
export type Container = {
  type?: 'container';
  /**
   * kind of container contents
   */
  kind: 'figure' | 'table';
  /**
   * any custom class information
   */
  class?: string;
  /**
   * count this container for numbering based on kind, e.g. Figure 1a
   */
  enumerated?: boolean;
  /**
   * resolved enumerated value for this container
   */
  enumerator?: string;
  children?: (Caption | Legend | Image | Table)[];
  identifier?: unknown;
  label?: unknown;
  position?: unknown;
  data?: unknown;
} & {} & OptionalAssociation3 &
  Parent24;
/**
 * Caption for container content
 */
export type Caption = {
  type?: 'caption';
  children?: FlowContent[];
  position?: unknown;
  data?: unknown;
} & Parent19;
/**
 * Basic node with required node children
 */
export type Parent19 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Legend for container content
 */
export type Legend = {
  type?: 'legend';
  children?: FlowContent[];
  position?: unknown;
  data?: unknown;
} & Parent20;
/**
 * Basic node with required node children
 */
export type Parent20 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Two-dimensional table data
 */
export type Table = {
  type?: 'table';
  align?: 'left' | 'center' | 'right';
  children?: TableRow[];
  position?: unknown;
  data?: unknown;
} & Parent23;
/**
 * One row of table containing cells
 */
export type TableRow = {
  type?: 'tableRow';
  children?: TableCell[];
  position?: unknown;
  data?: unknown;
} & Parent22;
/**
 * One cell of table
 */
export type TableCell = {
  type?: 'tableCell';
  header?: boolean;
  /**
   * alignment of content within cell
   */
  align?: 'left' | 'center' | 'right';
  children?: PhrasingContent[];
  position?: unknown;
  data?: unknown;
} & Parent21;
/**
 * Basic node with required node children
 */
export type Parent21 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Basic node with required node children
 */
export type Parent22 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Basic node with required node children
 */
export type Parent23 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Basic node with required node children
 */
export type Parent24 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Math node for presenting numbered equations
 */
export type Math = {
  type?: 'math';
  /**
   * count this math block for numbering based on kind, e.g. See equation (1a)
   */
  enumerated?: boolean;
  /**
   * resolved enumerated value for this math block
   */
  enumerator?: string;
  identifier?: unknown;
  label?: unknown;
  value?: unknown;
  position?: unknown;
  data?: unknown;
} & OptionalAssociation4 &
  Literal6;
/**
 * Basic node with required string value
 */
export type Literal6 = {
  /**
   * The value of the node
   */
  value: string;
} & Node;
/**
 * Rich footnote content associated with footnote reference
 */
export type FootnoteDefinition = {
  type?: 'footnoteDefinition';
  children?: FlowContent[];
  identifier?: unknown;
  label?: unknown;
  position?: unknown;
  data?: unknown;
} & Association5 &
  Parent25;
/**
 * Internal relation from one node to another
 */
export type Association5 = {
  identifier: unknown;
} & OptionalAssociation;
/**
 * Basic node with required node children
 */
export type Parent25 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;
/**
 * Top-level break in the myst document, breaking it into Blocks
 */
export type BlockBreak = {
  type?: 'blockBreak';
  /**
   * Block metadata. Conventionally this is a stringified JSON dictionary but it may be any arbitrary string.
   */
  meta?: string;
  position?: unknown;
  data?: unknown;
} & Node15;
/**
 * Basic node with required node children
 */
export type Parent26 = {
  /**
   * List of children nodes
   */
  children: Node1[];
} & Node2;

/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * location of node in source file; must not be present for generated nodes
 */
export interface Position {
  start: Point;
  end: Point1;
  /**
   * start column at each index in the source region, for elements that span multiple lines
   */
  indent?: number[];
}
/**
 * place of first character of parsed source region
 */
export interface Point {
  /**
   * line in the source file, 1-indexed
   */
  line: number;
  /**
   * column in the source file, 1-indexed
   */
  column: number;
  /**
   * offset character in the source file, 0-indexed
   */
  offset?: number;
}
/**
 * place of first character after parsed source region, whether it exists or not
 */
export interface Point1 {
  /**
   * line in the source file, 1-indexed
   */
  line: number;
  /**
   * column in the source file, 1-indexed
   */
  column: number;
  /**
   * offset character in the source file, 0-indexed
   */
  offset?: number;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node1 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node2 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node3 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Reference to external resource
 */
export interface Resource {
  /**
   * A Uniform Resource Locator (URL) to an external resource or link.
   */
  url: string;
  /**
   * advisory information, e.g. for a tooltip
   */
  title?: string;
}
/**
 * Alternative description of image
 */
export interface Alternative {
  /**
   * field describing the image
   */
  alt?: string;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node4 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Marker associated to another node
 */
export interface Reference {
  /**
   * explicitness of the reference:
   * `shortcut` - reference is implicit, identifier inferred
   * `collapsed` - reference explicit, identifier inferred
   * `full` - reference explicit, identifier explicit
   */
  referenceType: 'shortcut' | 'collapsed' | 'full';
}
/**
 * Internal relation from one node to another; not required by node
 */
export interface OptionalAssociation {
  /**
   * identifier that may match another node; value is unparsed and must be normalized such that whitespace is collapsed to single space, initial/final space is trimmed, and case is folded
   */
  identifier?: string;
  /**
   * node label; character escapes and references are parsed; may be normalized to a unique identifier
   */
  label?: string;
}
/**
 * Alternative description of image
 */
export interface Alternative1 {
  /**
   * field describing the image
   */
  alt?: string;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node5 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node6 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Reference to external resource
 */
export interface Resource1 {
  /**
   * A Uniform Resource Locator (URL) to an external resource or link.
   */
  url: string;
  /**
   * advisory information, e.g. for a tooltip
   */
  title?: string;
}
/**
 * Marker associated to another node
 */
export interface Reference1 {
  /**
   * explicitness of the reference:
   * `shortcut` - reference is implicit, identifier inferred
   * `collapsed` - reference explicit, identifier inferred
   * `full` - reference explicit, identifier explicit
   */
  referenceType: 'shortcut' | 'collapsed' | 'full';
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node7 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node8 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Reference to external resource
 */
export interface Resource2 {
  /**
   * A Uniform Resource Locator (URL) to an external resource or link.
   */
  url: string;
  /**
   * advisory information, e.g. for a tooltip
   */
  title?: string;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node9 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Internal relation from one node to another; not required by node
 */
export interface OptionalAssociation1 {
  /**
   * identifier that may match another node; value is unparsed and must be normalized such that whitespace is collapsed to single space, initial/final space is trimmed, and case is folded
   */
  identifier?: string;
  /**
   * node label; character escapes and references are parsed; may be normalized to a unique identifier
   */
  label?: string;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node10 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Internal relation from one node to another; not required by node
 */
export interface OptionalAssociation2 {
  /**
   * identifier that may match another node; value is unparsed and must be normalized such that whitespace is collapsed to single space, initial/final space is trimmed, and case is folded
   */
  identifier?: string;
  /**
   * node label; character escapes and references are parsed; may be normalized to a unique identifier
   */
  label?: string;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node11 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node12 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node13 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Internal relation from one node to another; not required by node
 */
export interface OptionalAssociation3 {
  /**
   * identifier that may match another node; value is unparsed and must be normalized such that whitespace is collapsed to single space, initial/final space is trimmed, and case is folded
   */
  identifier?: string;
  /**
   * node label; character escapes and references are parsed; may be normalized to a unique identifier
   */
  label?: string;
}
/**
 * Internal relation from one node to another; not required by node
 */
export interface OptionalAssociation4 {
  /**
   * identifier that may match another node; value is unparsed and must be normalized such that whitespace is collapsed to single space, initial/final space is trimmed, and case is folded
   */
  identifier?: string;
  /**
   * node label; character escapes and references are parsed; may be normalized to a unique identifier
   */
  label?: string;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node14 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
/**
 * Base node object, based on the [unist](https://github.com/syntax-tree/unist) syntax tree.
 */
export interface Node15 {
  /**
   * identifier for node variant
   */
  type: string;
  /**
   * information associated by the ecosystem with the node; never specified by mdast
   */
  data?: {
    [k: string]: unknown;
  };
  position?: Position;
}
