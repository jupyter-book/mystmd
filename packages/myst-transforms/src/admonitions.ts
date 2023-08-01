import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Admonition, AdmonitionTitle, Blockquote, FlowContent } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { GenericNode } from 'myst-common';
import { AdmonitionKind } from './types.js';

type Options = {
  /** Replace the admonition title with the first paragraph if it is all bold. */
  replaceAdmonitionTitles?: boolean;
};

const githubAdmonitionKinds = ['note', 'important', 'warning'];

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
    if (
      !node.kind ||
      (node.kind as string) === AdmonitionKind.admonition || // This condition is legacy
      node.children?.[0]?.type === 'admonitionTitle'
    ) {
      return;
    }
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

function transformGitHubBoldTitle(node: GenericNode): boolean {
  if (
    !node.children ||
    node.children?.[0]?.type !== 'paragraph' ||
    node.children[0].children?.[0]?.type !== 'strong'
  ) {
    return false;
  }
  const strong = node.children[0].children[0];
  if (strong.children?.[0].type !== 'text') return false;
  const kind = strong.children[0].value?.trim().toLowerCase() ?? '';
  if (!githubAdmonitionKinds.includes(kind)) return false;
  node.type = 'admonition';
  node.kind = kind;
  node.class = node.class ? node.class + ' simple' : 'simple';
  node.children[0].children.splice(0, 1); // Get rid of the strong node
  node.children = [
    {
      type: 'admonitionTitle',
      children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
    },
    ...node.children,
  ];
  return true;
}

function transformGitHubBracketedAdmonition(node: GenericNode): boolean {
  if (!node.children || node.children?.[0]?.type !== 'paragraph') return false;
  const firstNode = node.children[0]?.children?.[0];
  if (firstNode?.type !== 'text') return false;
  const match = firstNode.value?.trim().match(/^\[!([A-Za-z]+)\]/);
  if (!match) return false;
  const [, kind] = match;
  if (!githubAdmonitionKinds.includes(kind.toLowerCase())) return false;
  node.type = 'admonition';
  node.kind = kind.toLowerCase();
  node.class = node.class ? node.class + ' simple' : 'simple';
  firstNode.value = firstNode.value?.replace(/^\[!([A-Za-z]+)\](?:[\s]*)/, '');
  node.children = [
    {
      type: 'admonitionTitle',
      children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
    },
    ...node.children,
  ];
  return true;
}

/**
 * Visit all blockquote notes and add headers if necessary, support GitHub style admonitions
 */
export function admonitionBlockquoteTransform(tree: Root) {
  const blockquote = selectAll('blockquote', tree) as Blockquote[];
  blockquote.forEach((node: GenericNode) => {
    // Loop through the various flavours of blockquote admonitions and return early if already transformed
    [transformGitHubBracketedAdmonition, transformGitHubBoldTitle].reduce(
      (complete, fn) => complete || fn(node),
      false,
    );
  });
}

export const admonitionHeadersPlugin: Plugin<[Options?], Root, Root> = (opts) => (tree) => {
  admonitionHeadersTransform(tree, opts);
};

export const admonitionBlockquotePlugin: Plugin<[], Root, Root> = () => (tree) => {
  admonitionBlockquoteTransform(tree);
};
