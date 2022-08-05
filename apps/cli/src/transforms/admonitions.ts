import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import type { Root } from '../myst';

export function transformAdmonitions(mdast: Root) {
  const numbered = selectAll('admonition', mdast) as GenericNode[];
  numbered.forEach((node) => {
    if (!node.children) return;
    const [admonitionHeader, strongParagraph, ...rest] = node.children;
    if (
      strongParagraph.type === 'paragraph' &&
      strongParagraph.children?.length === 1 &&
      strongParagraph.children[0].type === 'strong'
    ) {
      const strongTextChildren = strongParagraph.children[0].children;
      admonitionHeader.children = strongTextChildren; // Replace the admonition text with the strong chidren
      node.children = [admonitionHeader, ...rest]; // remove the strong text
    }
  });
}
