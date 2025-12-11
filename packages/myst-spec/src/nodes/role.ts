import type { Parent, Literal, PhrasingContent } from 'mdast';

// Custom in-line behavior.
export interface Role extends Literal, Parent {
  /**
   * Node type of myst mystRole.
   */
  type: 'mystRole';
  name: string;
  /**
   * Content of the directive.
   */
  value: string;
  /**
   * Parsed role content.
   */
  children: PhrasingContent[];
}
