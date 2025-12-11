import type { Parent, PhrasingContent } from 'mdast';
/**
 * AlgorithmLine is, e.g., a line in an algorithm and can be numbered as well as indented.
 * Otherwise this works the same as a paragraph, ideally with tighter styling.
 * The Line is used in Algorithms (e.g. when parsing from LaTeX)
 */
export interface AlgorithmLine extends Parent {
  type: 'algorithmLine';
  indent?: number;
  enumerator?: string;
  children: PhrasingContent[];
}
