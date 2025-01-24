import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { GenericParent } from 'myst-common';
import { liftMystDirectivesAndRolesTransform } from './liftMystDirectivesAndRoles.js';
import { mystTargetsTransform, headingLabelTransform } from './targets.js';
import { captionParagraphTransform } from './caption.js';
import {
  admonitionBlockquoteTransform,
  admonitionHeadersTransform,
  admonitionQmdTransform,
} from './admonitions.js';
import { blockMetadataTransform, blockNestingTransform, blockToFigureTransform } from './blocks.js';
import { htmlIdsTransform } from './htmlIds.js';
import { imageAltTextTransform, imageNoAltTextTransform } from './images.js';
import { mathLabelTransform, mathNestingTransform, subequationTransform } from './math.js';
import { blockquoteTransform } from './blockquote.js';
import { codeBlockToDirectiveTransform, inlineCodeFlattenTransform } from './code.js';
import { removeUnicodeTransform } from './removeUnicode.js';
import { containerChildrenTransform } from './containers.js';
import { headingDepthTransform } from './headings.js';
import { joinGatesTransform } from './joinGates.js';

export function basicTransformations(tree: GenericParent, file: VFile, opts?: Record<string, any>) {
  // lifting roles and directives must happen before the mystTarget transformation
  liftMystDirectivesAndRolesTransform(tree);
  // Some specifics about the ordering are noted below
  // Target transformation must happen after lifting the directives, and before the heading labels
  mystTargetsTransform(tree, file);
  captionParagraphTransform(tree);
  codeBlockToDirectiveTransform(tree, file, { translate: ['math', 'mermaid'] });
  mathNestingTransform(tree, file);
  // Math labelling will not apply to nodes labeled during mystTargetsTransform
  mathLabelTransform(tree, file);
  subequationTransform(tree, file);
  // Label headings after the targets-transform
  headingLabelTransform(tree);
  admonitionQmdTransform(tree);
  admonitionBlockquoteTransform(tree); // Must be before header transforms
  admonitionHeadersTransform(tree);
  joinGatesTransform(tree, file); // This should be before block nesting
  blockNestingTransform(tree);
  // Block metadata may contain labels/html_ids
  blockMetadataTransform(tree, file);
  blockToFigureTransform(tree, opts);
  containerChildrenTransform(tree, file);
  htmlIdsTransform(tree);
  imageAltTextTransform(tree);
  imageNoAltTextTransform(tree, file);
  blockquoteTransform(tree);
  removeUnicodeTransform(tree);
  headingDepthTransform(tree, file, opts);
  inlineCodeFlattenTransform(tree, file);
}

export const basicTransformationsPlugin: Plugin<
  [Record<string, any>],
  GenericParent,
  GenericParent
> = (opts) => (tree, file) => {
  basicTransformations(tree, file, opts);
};
