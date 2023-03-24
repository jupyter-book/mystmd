import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';

import { definitionTransform } from './definitions';
import { containerTransform } from './containers';
import { tableTransform } from './tables';
import { sectionTransform } from './sections';
import { citeGroupTransform } from './citations';

export { definitionTransform, definitionPlugin } from './definitions';
export { containerTransform, containerPlugin } from './containers';
export { tableTransform, tablePlugin } from './tables';
export { sectionTransform, sectionPlugin } from './sections';

export function basicTransformations(tree: Root, file: VFile) {
  definitionTransform(tree);
  containerTransform(tree);
  tableTransform(tree);
  sectionTransform(tree);
  citeGroupTransform(tree);
}

export const basicTransformationsPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  basicTransformations(tree, file);
};
