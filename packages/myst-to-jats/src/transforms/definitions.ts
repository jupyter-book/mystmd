import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Parent } from 'myst-spec';
import { selectAll } from 'unist-util-select';

export type DefinitionList = Parent & { type: 'definitionList' };
export type DefinitionItem = Parent & { type: 'definitionItem' };
export type DefinitionTerm = Parent & { type: 'definitionTerm' };
export type DefinitionDescription = Parent & { type: 'definitionDescription' };

export function definitionTransform(mdast: Root) {
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
    node.children = children;
  });
}

export const definitionPlugin: Plugin<[], Root, Root> = () => (tree) => {
  definitionTransform(tree);
};
