import type { GenericParent } from 'myst-common';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';

import { sectionTransform } from './sections';
import { typographyTransform } from './typography';
import { admonitionTransform } from './admonitions';

export { sectionTransform, sectionPlugin } from './sections';
export { typographyTransform, typographyPlugin } from './typography';
export { admonitionTransform, admonitionPlugin } from './admonitions';

export function basicTransformations(tree: GenericParent, file: VFile) {
  sectionTransform(tree);
  typographyTransform(tree, file);
  admonitionTransform(tree, file);
}

export const basicTransformationsPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, file) => {
    basicTransformations(tree, file);
  };
