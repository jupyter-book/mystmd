import type { Association, Parent, PhrasingContent } from 'mdast';
import type { FlowContent } from './flow.js';

/**
 * Custom title for admonition, replaces kind as title.
 */
export interface AdmonitionTitle extends Parent {
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
export interface Admonition extends Parent {
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
