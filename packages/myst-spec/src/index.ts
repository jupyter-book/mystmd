import type { TopLevelContent as MdastTopLevelContent } from 'mdast';
// Interfaces
import type { AssociationExtension } from './extensions/association.js';
import type { FootnoteReferenceExtension } from './extensions/footnote.js';
import type { EnumeratedExtension } from './extensions/enumerated.js';
// Nodes
import type { Role } from './nodes/role.js';
import type { BlockBreak, Block } from './nodes/block.js';
import type { Abbreviation } from './nodes/abbreviation.js';
import type { Math, InlineMath, MathGroup } from './nodes/math.js';
import type { Target, CrossReference } from './nodes/reference.js';
import type { Admonition, AdmonitionTitle } from './nodes/admonition.js';
import type { Comment } from './nodes/comment.js';
import type { Directive } from './nodes/directive.js';
import type { Caption, Legend, Container, CaptionNumber } from './nodes/container.js';
import type { SmallCaps, Underline } from './nodes/phrasing.js';
import type { DefinitionTerm, DefinitionDescription, DefinitionList } from './nodes/definition.js';
import type { AlgorithmLine } from './nodes/algorithmLine.js';

declare module 'mdast' {
  // 1. Extend Association to include HTML ID and index entries
  interface Association extends AssociationExtension {}
  type Referenceable = Partial<Association>;

  // 2. Make all node types extend Association
  // Make mdast parents associable, and literals
  interface Literal extends Partial<Association> {}
  interface Parent extends Partial<Association> {}
  // Make other node types associable. We can't touch Node, because it's not specific to mdast
  interface Definition extends Partial<Association> {}
  interface Break extends Partial<Association> {}
  interface Image extends Partial<Association> {}
  interface ImageReference extends Partial<Association> {}
  interface FootnoteReference extends Partial<Association> {}
  interface ThematicBreak extends Partial<Association> {}

  // 3. Headings and other types can be enumerated, or otherwise extended
  interface Heading extends Referenceable, Partial<EnumeratedExtension> {}
  interface FootnoteReference extends FootnoteReferenceExtension, Partial<EnumeratedExtension> {}
  interface FootnoteDefinition extends Partial<EnumeratedExtension> {}

  // 4. Expand set of known types
  // N.B. Static-Phrasing distinction disappears in v4
  /// This interface can be augmented to register custom node types in a phrasing context, including links and link references.
  interface StaticPhrasingContentMap {
    inlineMath: InlineMath;
    mystRole: Role;
    abbreviation: Abbreviation;
    smallCaps: SmallCaps;
    underline: Underline;
    captionNumber: CaptionNumber;
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
    legend: Legend;
    definitionTerm: DefinitionTerm;
    definitionDescription: DefinitionDescription;
  }

  /// These types are accepted inside block quotes, list items, footnotes, and roots.
  /// RootContent is a useful type description from v4, so we also use it here internally
  /// When we move to v4, we'll remove RootContentMap from here and lift it up
  interface BlockContentMap extends RootContentMap {
    math: Math;
    mathGroup: MathGroup;
    admonition: Admonition;
    mystComment: Comment;
    directive: Directive;
    mystTarget: Target;
    container: Container;
    definitionList: DefinitionList;
    algorithmLine: AlgorithmLine;
  }
}
// Extend this to allow blocks at the top
export type TopLevelContent = MdastTopLevelContent | Block;
// An verbal-spec-based term that we use, so we'll export.
export type { FlowContent } from './nodes/flow.js';

export type * from 'mdast';
export type * from './nodes/role.js';
export type * from './nodes/block.js';
export type * from './nodes/admonition.js';
export type * from './nodes/abbreviation.js';
export type * from './nodes/comment.js';
export type * from './nodes/math.js';
export type * from './nodes/directive.js';
export type * from './nodes/reference.js';
export type * from './nodes/phrasing.js';
export type * from './nodes/definition.js';
export type * from './nodes/algorithmLine.js';
