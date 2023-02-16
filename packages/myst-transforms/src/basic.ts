import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { liftMystDirectivesAndRolesTransform } from './liftMystDirectivesAndRoles';
import { mystTargetsTransform, headingLabelTransform } from './targets';
import { captionParagraphTransform } from './caption';
import { admonitionHeadersTransform } from './admonitions';
import { blockMetadataTransform, blockNestingTransform } from './blocks';
import { htmlIdsTransform } from './htmlIds';
import { imageAltTextTransform } from './images';
import { mathLabelTransform, mathNestingTransform } from './math';
import { blockquoteTransform } from './blockquote';

export function basicTransformations(tree: Root, file: VFile) {
  // lifting roles and directives must happen before the mystTarget transformation
  liftMystDirectivesAndRolesTransform(tree);
  // Some specifics about the ordering are noted below
  captionParagraphTransform(tree);
  mathNestingTransform(tree, file);
  // Math labelling should happen before the target-transformation
  mathLabelTransform(tree, file);
  // Target transformation must happen after lifting the directives, and before the heading labels
  mystTargetsTransform(tree);
  // Label headings after the targets-transform
  headingLabelTransform(tree);
  admonitionHeadersTransform(tree);
  blockNestingTransform(tree);
  // Block metadata may contain labels/html_ids
  blockMetadataTransform(tree, file);
  htmlIdsTransform(tree);
  imageAltTextTransform(tree);
  blockquoteTransform(tree);
}

export const basicTransformationsPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  basicTransformations(tree, file);
};
