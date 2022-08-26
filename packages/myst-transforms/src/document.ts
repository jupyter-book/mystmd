import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { IState } from './enumerate';
import { enumerateTargetsTransform, resolveReferencesTransform } from './enumerate';
import { mystCleanupTransform } from './mystCleanup';
import { mystTargetsTransform, headingLabelTransform } from './targets';
import { captionParagraphTransform } from './caption';
import { admonitionHeadersTransform } from './admonitions';

export type TransformOptions = {
  state: IState;
};

function basicTransformations(tree: Root, opts: TransformOptions) {
  captionParagraphTransform(tree);
  mystTargetsTransform(tree);
  headingLabelTransform(tree);
  mystCleanupTransform(tree);
  admonitionHeadersTransform(tree);
  enumerateTargetsTransform(tree, opts);
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
