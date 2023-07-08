import type { Root } from 'mdast';
import type { Plugin } from 'unified';

import { definitionTransform } from './definitions.js';
import { containerTransform } from './containers.js';
import { tableTransform } from './tables.js';
import { sectionTransform } from './sections.js';
import { citeGroupTransform } from './citations.js';
import type { Options } from '../types.js';

export { definitionTransform, definitionPlugin } from './definitions.js';
export { containerTransform, containerPlugin } from './containers.js';
export { tableTransform, tablePlugin } from './tables.js';
export { sectionTransform, sectionPlugin } from './sections.js';
export { referenceTargetTransform, referenceResolutionTransform } from './references.js';

export function basicTransformations(tree: Root, opts: Options) {
  definitionTransform(tree);
  containerTransform(tree);
  tableTransform(tree);
  sectionTransform(tree, opts);
  citeGroupTransform(tree);
}

export const basicTransformationsPlugin: Plugin<[Options], Root, Root> = (opts) => (tree) => {
  basicTransformations(tree, opts);
};
