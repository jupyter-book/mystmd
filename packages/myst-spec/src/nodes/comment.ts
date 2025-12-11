import type { Literal } from 'mdast';

/**
 * Comment nodes for comments present in myst but ignored upon render.
 */
export interface Comment extends Literal {
  /**
   * Node type of myst comment.
   */
  type: 'mystComment';
}
