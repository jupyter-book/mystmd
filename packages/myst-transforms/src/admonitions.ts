import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Admonition, AdmonitionTitle, FlowContent } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import { AdmonitionKind } from './types';

type Options = {
  /** Replace the admonition title with the first paragraph if it is all bold. */
  replaceAdmonitionTitles?: boolean;
};

export function admonitionKindToTitle(kind: AdmonitionKind | string) {
  const transform: Record<string, string> = {
    attention: 'Attention',
    caution: 'Caution',
    danger: 'Danger',
    error: 'Error',
    important: 'Important',
    hint: 'Hint',
    note: 'Note',
    seealso: 'See Also',
    tip: 'Tip',
    warning: 'Warning',
  };
  return transform[kind] || `Unknown Admonition "${kind}"`;
}

/**
 * Visit all admonitions and add headers if necessary
 */
export function admonitionHeadersTransform(tree: Root, opts?: Options) {
  const admonitions = selectAll('admonition', tree) as Admonition[];
  admonitions.forEach((node: Admonition) => {
    if (!node.kind || (node.kind as string) === AdmonitionKind.admonition) return;
    node.children = [
      {
        type: 'admonitionTitle',
        children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
      },
      ...(node.children ?? []),
    ];
    // Replace the admonition title with bold text if it is provided
    if (opts?.replaceAdmonitionTitles ?? true) {
      const [admonitionHeader, possibleHeading, ...rest] = node.children as [
        AdmonitionTitle,
        FlowContent,
      ];
      if (
        possibleHeading?.type === 'paragraph' &&
        possibleHeading.children?.length === 1 &&
        possibleHeading.children[0].type === 'strong'
      ) {
        const strongTextChildren = possibleHeading.children[0].children;
        admonitionHeader.children = strongTextChildren; // Replace the admonition text with the strong chidren
        node.children = [admonitionHeader, ...rest]; // remove the strong text
      } else if (possibleHeading?.type === 'heading') {
        admonitionHeader.children = possibleHeading.children; // Replace the admonition text with the heading chidren
        node.children = [admonitionHeader, ...rest]; // remove the strong text
      }
    }
  });
}

export const admonitionHeadersPlugin: Plugin<[Options?], Root, Root> = (opts) => (tree) => {
  admonitionHeadersTransform(tree, opts);
};
