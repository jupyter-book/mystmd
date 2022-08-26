import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { mystCleanupTransform } from './mystCleanup';
import { mystTargetsTransform, headingLabelTransform } from './targets';
import { captionParagraphTransform } from './caption';
import { admonitionHeadersTransform } from './admonitions';
import { blockNestingTransform } from './blocks';
import { htmlIdsTransform } from './htmlIds';
import { codeBlockTransform } from './codeBlock';
import { imageAltTextTransform } from './images';

export function basicTransformations(tree: Root) {
  // Must happen first
  codeBlockTransform(tree); // TODO: ideally move this to the parser
  // Can happen in mostly any order
  captionParagraphTransform(tree);
  mystTargetsTransform(tree);
  headingLabelTransform(tree);
  mystCleanupTransform(tree);
  admonitionHeadersTransform(tree);
  htmlIdsTransform(tree);
  blockNestingTransform(tree);
  imageAltTextTransform(tree);
}

export const basicTransformationsPlugin: Plugin<[], Root, Root> = () => (tree: Root) => {
  basicTransformations(tree);
};
