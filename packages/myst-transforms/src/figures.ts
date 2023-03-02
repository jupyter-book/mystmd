import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { GenericNode } from 'myst-common';
import { fileWarn, liftChildren } from 'myst-common';
import type { Container } from 'myst-spec';
import { u } from 'unist-builder';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

/**
 * Convert text like "Figure 1" to a figure cross reference
 *
 * Examples:
 *
 * - Figure 1
 * - fig. 27
 * - FIG4
 */
export function figureTextTransform(tree: Root, file: VFile) {
  const containerNodes = selectAll('container', tree) as Container[];
  const figureNodes = containerNodes.filter((n) => n.kind === 'figure');
  const textNodes = selectAll('text', tree) as GenericNode[];
  textNodes.forEach((node: GenericNode) => {
    if (!node.value) return;
    const children: GenericNode[] = [];
    let match: RegExpExecArray | null;
    let firstIndex = 0;
    const figureNumberPattern = /fig((ure)|\.){0,1} {0,1}(?<number>[0-9]+)/gi;
    while ((match = figureNumberPattern.exec(node.value))) {
      const figureNumber = match?.groups?.number;
      const { identifier } = figureNodes.find((n) => n.enumerator === figureNumber) || {};
      if (!identifier) {
        fileWarn(file, `Unable to find figure number "${figureNumber}"`);
        return;
      }
      children.push(u('text', node.value.substring(firstIndex, match.index)));
      firstIndex = figureNumberPattern.lastIndex;
      children.push(
        u('crossReference', { identifier, label: identifier, kind: 'figure' }, [
          u('text', node.value.substring(match.index, firstIndex)),
        ]),
      );
    }
    if (!children.length) return;
    if (firstIndex < node.value.length) {
      children.push(u('text', node.value.substring(firstIndex)));
    }
    node.type = '_lift';
    node.children = children;
  });
  liftChildren(tree, '_lift');
}

export const figureTextPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  figureTextTransform(tree, file);
};
