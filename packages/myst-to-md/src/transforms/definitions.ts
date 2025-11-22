import type { Plugin } from 'unified';
import type { Parent } from 'myst-spec';
import type { DefinitionDescription } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { phrasingTypes } from './utils.js';

export type DefinitionItem = Parent & { type: 'definitionItem' };

/**
 * It will ensure defDescriptions that are not paragraphs are wrapped in paragraphs.
 */
export function definitionTransform(mdast: GenericParent) {
  const defDescriptions = selectAll('definitionDescription', mdast) as DefinitionDescription[];
  defDescriptions.forEach((node) => {
    const hasPhrasingContent = node.children.some((n) => phrasingTypes.has(n.type));
    if (!hasPhrasingContent) return;
    node.children = [{ type: 'paragraph', children: [...node.children] }] as GenericNode[];
  });
}

export const definitionPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  definitionTransform(tree);
};
