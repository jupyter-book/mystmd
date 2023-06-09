import type { GenericNode, GenericParent } from 'myst-common';
import { fileWarn, fileError } from 'myst-common';
import { map } from 'unist-util-map';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';

export function joinGatesTransform(tree: GenericParent, file: VFile) {
  map(tree, (node) => {
    const nodes = (node.children as GenericParent[])?.reduce((children, child) => {
      const [last] = children.slice(-1);
      const [secondLast] = children.slice(-2);
      if (last?.gate !== 'start') return [...children, child];
      if (child.gate === 'start') {
        // If we are opening a new gate, add to the stack and the logic below will close it
        return [...children, child];
      }
      if (child.gate === 'end') {
        if (child.type !== last.type) {
          fileWarn(
            file,
            `Gate close ("${child.type}") does not match opening gate (${child.gate}).`,
            { node },
          );
        }
        // Clean up the gate logic
        delete last.gate;
        if (secondLast?.gate === 'start') {
          // We have two or more open gates (from above), close the current one and append the child
          const closed = children.pop() as GenericNode;
          secondLast.children = [...(secondLast.children ?? []), closed];
        }
        return children;
      }
      // Append the child to the open gate if no end is found
      last.children = [...(last.children ?? []), child];
      return children;
    }, [] as GenericNode[]);
    const [last] = nodes?.slice(-1) ?? [];
    if (last?.gate === 'start') {
      fileError(file, `Gated node is not closed, expected a {${last.type}-end} directive.`, {
        node,
      });
    }
    if (nodes !== undefined) (node as GenericParent).children = nodes;
    return node;
  });
}

export const joinGatesPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  joinGatesTransform(tree as GenericParent, file);
};
