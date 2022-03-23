import { nodes, NodeTypes } from 'myst-util-to-react';
import { admonitionRenderers } from './admonitions';
import { citeRenderers } from './cite';
import { footnoteRenderers } from './footnotes';
import { codeRenderers } from './code';
import { mathRenderers } from './math';
import { reactiveRenderers } from './reactive';
import { iframeRenderers } from './iframe';
import { linkRenderers } from './links';
import { outputRenderers } from './output';

export const defaultRenderers: NodeTypes = {
  ...nodes,
  ...linkRenderers,
  ...codeRenderers,
  ...mathRenderers,
  ...citeRenderers,
  ...iframeRenderers,
  ...footnoteRenderers,
  ...admonitionRenderers,
  ...reactiveRenderers,
  ...outputRenderers,
};
