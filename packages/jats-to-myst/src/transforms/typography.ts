import type { Plugin } from 'unified';
import type { GenericParent } from 'myst-common';
import { unnestTransform } from 'myst-transforms';
import { Tags } from 'jats-xml';

export function typographyTransform(tree: GenericParent) {
  unnestTransform(tree, Tags.p, Tags.list);
  unnestTransform(tree, Tags.p, Tags.boxedText);
}

export const typographyPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  typographyTransform(tree);
};
