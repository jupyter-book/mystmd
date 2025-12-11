import type { Literal, Parent } from 'mdast';
import type { EnumeratedExtension } from '../extensions/enumerated.js';

/**
 * Math node for presenting numbered equations.
 */
export interface Math extends Literal, Partial<EnumeratedExtension> {
  /**
   * Node type of myst math.
   */
  type: 'math';
  /** Typst-specific math content. If not provided, LaTeX content will be converted to Typst. */
  typst?: string;
  kind?: 'subequation';
  tight?: 'before' | 'after' | boolean;
}

/**
 * Fragment of math, similar to InlineCode, using role {math}.
 */
export interface InlineMath extends Literal {
  /**
   * Node type of myst inlineMath.
   */
  type: 'inlineMath';
  /** Typst-specific math content. If not provided, LaTeX content will be converted to Typst. */
  typst?: string;
}

export interface MathGroup extends Parent {
  type: 'mathGroup';

  children: Math[];
}
