import type { Association, Parent, PhrasingContent } from 'mdast';
import type { Node } from 'unist';

/**
 * Target node - provides identifier/label for the following node.
 */
export interface Target extends Node {
  /**
   * Node type of myst mystTarget.
   */
  type: 'mystTarget';
  label?: string;
}

/**
 * In-line reference to an associated node.
 */
export interface CrossReference extends Association, Pick<Parent, 'children'> {
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
