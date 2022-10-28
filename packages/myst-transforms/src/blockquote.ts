import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Blockquote, Caption, Container } from 'myst-spec';
import { selectAll } from 'unist-util-select';

export function blockquoteTransform(mdast: Root) {
  const quotes = selectAll('blockquote', mdast) as Blockquote[];
  quotes.forEach((node) => {
    if (node.children.length < 2) return;
    const possibleList = node.children[node.children.length - 1];
    if (possibleList.type !== 'list' || possibleList.children?.length !== 1) return;
    const container = node as unknown as Container;
    container.type = 'container';
    (container as any).kind = 'quote';
    const caption: Caption = {
      type: 'caption',
      children: [{ type: 'paragraph', children: possibleList.children[0].children as any }],
    };
    const blockquote: Blockquote = { type: 'blockquote', children: node.children.slice(0, -1) };
    container.children = [blockquote as any, caption];
  });
}

export const blockquotePlugin: Plugin<[], Root, Root> = () => (tree) => {
  blockquoteTransform(tree);
};
