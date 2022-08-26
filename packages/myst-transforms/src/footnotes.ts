import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { FootnoteDefinition } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import { remove } from 'unist-util-remove';
import { keysTransform } from './keys';
import type { References } from './types';

type Options = {
  references: Pick<References, 'footnotes'>;
};

export function footnotesTransform(mdast: Root, opts: Options) {
  const footnotes = selectAll('footnoteDefinition', mdast) as FootnoteDefinition[];
  opts.references.footnotes = Object.fromEntries(
    footnotes.map((n) => [n.identifier, keysTransform(n)]),
  );
  remove(mdast, 'footnoteDefinition');
}

export const footnotesPlugin: Plugin<[Options], Root, Root> = (opts) => (tree) => {
  footnotesTransform(tree, opts);
};
