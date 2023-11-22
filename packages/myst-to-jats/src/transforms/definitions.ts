import type { Plugin } from 'unified';
import type { Parent } from 'myst-spec';
import type { DefinitionDescription, DefinitionList } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';

export type DefinitionItem = Parent & { type: 'definitionItem' };

/**
 * This transforms a flat list of alternating dt/dd into a definitionItem for each term.
 *  - `defList -> [defTerm, defDescription, defDescription, defTerm, defDescription]`
 *  - `defList -> [defItem -> [defTerm, defDescription, defDescription], defItem -> [defTerm, defDescription]]`
 *
 * It will also ensure that any nested defDescriptions that are not paragraphs are wrapped in paragraphs.
 */
export function definitionTransform(mdast: GenericParent) {
  const defList = selectAll('definitionList', mdast) as DefinitionList[];
  defList.forEach((node) => {
    const children: DefinitionItem[] = [];
    let current: DefinitionItem | undefined = undefined;
    function pushItem() {
      if (current && current.children.length > 0) {
        children.push(current);
      }
      current = { type: 'definitionItem', children: [] };
    }
    node.children.forEach((child) => {
      if (child.type === 'definitionTerm' || !current) {
        pushItem();
      }
      current?.children.push(child);
    });
    pushItem();
    node.children = children as unknown as DefinitionList['children'];
  });
  // Ensure that the only children of the def node are paragraphs
  // This is necessary for the JATS spec
  const defDescriptions = selectAll('definitionDescription', mdast) as DefinitionDescription[];
  defDescriptions.forEach((node) => {
    const allParagraphs = node.children.reduce((b, n) => b && n.type === 'paragraph', true);
    const oneParagraph = !!node.children.find((n) => n.type === 'paragraph');
    // If there isn't any paragraph, it is likely text/inline content and we can handle this in the renderer
    if (allParagraphs || !oneParagraph) return;
    node.children = node.children.map((child) => {
      if (child.type === 'paragraph') return child;
      return { type: 'paragraph', children: [child] };
    });
  });
}

export const definitionPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  definitionTransform(tree);
};
