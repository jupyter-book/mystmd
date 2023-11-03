import type { Plugin } from 'unified';
import type { Text } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';

const remove = ['', '', ''];

export function removeUnicodeTransform(tree: GenericParent) {
  const textNodes = selectAll('text', tree) as Text[];
  textNodes.forEach((text) => {
    text.value = remove.reduce((p, r) => p.replaceAll(r, ''), text.value);
  });
}

export const removeUnicodePlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  removeUnicodeTransform(tree);
};
