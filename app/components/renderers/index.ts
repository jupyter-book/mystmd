import { nodes, NodeTypes } from 'myst-util-to-react';
import { admonitionRenderers } from './admonitions';
import { citeRenderers } from './cite';
import { footnoteRenderers } from './footnotes';
import { codeRenderers } from './code';
import { mathRenderers } from './math';
import { reactiveRenderers } from './reactive';
import { iframeRenderers } from './iframe';

export const defaultRenderers: NodeTypes = {
  ...nodes,
  ...codeRenderers,
  ...mathRenderers,
  ...citeRenderers,
  ...iframeRenderers,
  ...footnoteRenderers,
  ...admonitionRenderers,
  ...reactiveRenderers,
};
