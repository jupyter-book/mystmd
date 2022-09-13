import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { mystCleanupTransform } from './mystCleanup';
import { mystTargetsTransform, headingLabelTransform } from './targets';
import { captionParagraphTransform } from './caption';
import { admonitionHeadersTransform } from './admonitions';
import { blockMetadataTransform, blockNestingTransform } from './blocks';
import { htmlIdsTransform } from './htmlIds';
import { codeBlockTransform } from './codeBlock';
import { imageAltTextTransform } from './images';
import { mathLabelTransform } from './math';
import { blockquoteTransform } from './blockquote';

export function basicTransformations(tree: Root, file: VFile) {
  // Must happen first
  codeBlockTransform(tree); // TODO: ideally move this to the parser
  // Can happen in mostly any order
  captionParagraphTransform(tree);
  mathLabelTransform(tree, file);
  mystTargetsTransform(tree);
  headingLabelTransform(tree);
  mystCleanupTransform(tree);
  admonitionHeadersTransform(tree);
  htmlIdsTransform(tree);
  blockNestingTransform(tree);
  blockMetadataTransform(tree, file);
  imageAltTextTransform(tree);
  blockquoteTransform(tree);
}

export const basicTransformationsPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  basicTransformations(tree, file);
};
