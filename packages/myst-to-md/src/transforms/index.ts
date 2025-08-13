import type { Plugin } from 'unified';

import type { GenericParent } from 'myst-common';
import { definitionTransform } from './definitions.js';

export { definitionTransform, definitionPlugin } from './definitions.js';

export function basicTransformations(tree: GenericParent) {
  definitionTransform(tree);
}

export const basicTransformationsPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree) => {
    basicTransformations(tree);
  };
