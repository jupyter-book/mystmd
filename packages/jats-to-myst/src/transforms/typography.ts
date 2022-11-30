import type { Plugin } from 'unified';
import type { GenericParent } from 'myst-common';
import { copyNode } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { modifyChildren } from 'unist-util-modify-children';
import { Tags } from 'jats-xml';
import type { VFile } from 'vfile';

/**
 * Lift a child from a parent node. All information on the paragraph is copied (e.g. classes)
 *
 * ```
 * [ ..., {paragraph: [child1, math1, child2, child3, math2]}, ... ]
 * [ ..., {paragraph: [child1]}, math1, {paragraph: [child2, child3]}, math2, ... ]
 * ```
 *
 * @param tree
 * @param parentNodeType The parent (e.g. a paragraph)
 * @param childNodeType The child (e.g. a list or math)
 */
function unnestTransform(tree: GenericParent, parentNodeType: string, childNodeType: string) {
  const modify = modifyChildren((node, index, parent) => {
    if (node.type !== parentNodeType || selectAll(childNodeType, node).length === 0) return;
    const paragraph = node as GenericParent;
    const unnested: GenericParent[] = [];
    const { children, ...rest } = paragraph;
    const createTemplate = (): GenericParent => copyNode({ ...rest, children: [] });
    let current = createTemplate();
    const pushContent = () => {
      if (current.children.length > 0) {
        unnested.push(current);
      }
      current = createTemplate();
    };
    children.forEach((child) => {
      if ((child as any).type === childNodeType) {
        const math = child as GenericParent;
        pushContent();
        unnested.push(math);
      } else {
        current.children.push(child);
      }
    });
    pushContent();
    // Replace the current paragraph with the unnested nodes
    parent.children.splice(index, 1, ...unnested);
    return index + unnested.length;
  });
  const parents = selectAll(
    `*:has(${parentNodeType}:has(${childNodeType}))`,
    tree,
  ) as GenericParent[];
  parents.forEach((parent) => {
    modify(parent as any);
  });
}

export function typographyTransform(tree: GenericParent, file: VFile) {
  unnestTransform(tree, Tags.p, Tags.list);
  unnestTransform(tree, Tags.p, Tags.boxedText);
}

export const typographyPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree, file) => {
  typographyTransform(tree, file);
};
