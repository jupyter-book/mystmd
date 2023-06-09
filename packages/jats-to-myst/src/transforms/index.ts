import type { GenericParent } from 'myst-common';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';

import { sectionTransform } from './sections.js';
import { typographyTransform } from './typography.js';
import { admonitionTransform } from './admonitions.js';

export { sectionTransform, sectionPlugin } from './sections.js';
export { typographyTransform, typographyPlugin } from './typography.js';
export { admonitionTransform, admonitionPlugin } from './admonitions.js';

export function basicTransformations(tree: GenericParent, file: VFile) {
  sectionTransform(tree);
  typographyTransform(tree);
  admonitionTransform(tree, file);
}

export const basicTransformationsPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, file) => {
    basicTransformations(tree, file);
  };
