import type { Parent, PhrasingContent } from 'mdast';

/**
 * Abbreviation node described by title.
 */
export interface Abbreviation extends Parent {
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
