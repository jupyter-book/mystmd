import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { IReferenceState } from './enumerate';
import { enumerateTargetsTransform, resolveReferencesTransform } from './enumerate';
import { mystCleanupTransform } from './mystCleanup';
import { mystTargetsTransform, headingLabelTransform } from './targets';
import { captionParagraphTransform } from './caption';
import { admonitionHeadersTransform } from './admonitions';
import { blockNestingTransform } from './blocks';
import { htmlIdsTransform } from './htmlIds';

export type TransformOptions = {
  state: IReferenceState;
};

function basicTransformations(tree: Root, opts: TransformOptions) {
  captionParagraphTransform(tree);
  mystTargetsTransform(tree);
  headingLabelTransform(tree);
  mystCleanupTransform(tree);
  admonitionHeadersTransform(tree);
  enumerateTargetsTransform(tree, opts);
  htmlIdsTransform(tree);
  blockNestingTransform(tree);
}

export const singleDocumentPlugin: Plugin<[TransformOptions], Root, Root> =
  (opts) => (tree: Root) => {
    basicTransformations(tree, opts);
    resolveReferencesTransform(tree, opts);
  };

export const multiDocumentPlugin: Plugin<[TransformOptions], Root, Root> =
  (opts) => (tree: Root) => {
    basicTransformations(tree, opts);
  };
