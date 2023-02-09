import type { Root } from 'mdast';
import { selectAll } from 'unist-util-select';
import type { DirectiveSpec } from './types';

export function applyDirectives(tree: Root, directives: DirectiveSpec[]) {
  const directiveNodes = selectAll('mystDirective', tree);
}
