import type { Association, Parent, Literal } from 'mdast';
import type { FlowContent } from './flow.js';

/**
 * Content block with predefined behavior.
 */
export interface Directive extends Parent, Literal {
  /**
   * Node type of myst mystDirective.
   */
  type: 'mystDirective';
  name: string;
  args?: string;
  options?: { [key: string]: unknown };
  /**
   * body of the directive, excluding options.
   */
  value: string;
  /**
   * Parsed directive content.
   */
  children: FlowContent[];
}
