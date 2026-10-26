import type { Plugin } from 'unified';
import type { State as HastState } from 'hast-util-to-mdast';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAfter } from 'unist-util-find-after';
import { remove } from 'unist-util-remove';
import { liftChildren, normalizeLabel, AdmonitionKind, admonitionKindToTitle } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import type { EnumeratorOptions, State } from './state.js';
import { enumerateTargets, resolveReferences } from './state.js';
import type { HtmlToMdastOptions } from './htmlToMdast.js';
import { createMdastNode, htmlToMdast } from './htmlToMdast.js';

export type { HtmlToMdastOptions };

export type Admonition = GenericNode<{
  kind?: AdmonitionKind;
  class?: string;
}>;

export type TransformOptions = {
  addAdmonitionHeaders?: boolean;
  addContainerCaptionNumbers?: boolean;
} & EnumeratorOptions;

const defaultOptions: Record<keyof TransformOptions, boolean> = {
  addAdmonitionHeaders: true,
  addContainerCaptionNumbers: true,
  disableHeadingEnumeration: false,
  disableContainerEnumeration: false,
  disableEquationEnumeration: false,
};

const defaultHtmlToMdastOptions: Record<keyof HtmlToMdastOptions, any> = {
  keepBreaks: true,
  document: true,
  htmlHandlers: {
    table(state: HastState, node: any) {
      return createMdastNode(state, node, 'table', {}, state.all(node));
    },
    th(state: HastState, node: any) {
      const result = createMdastNode(state, node, 'tableCell', {}, state.all(node));
      result.header = true;
      return result;
    },
  },
};

// Visit all admonitions and add headers if necessary
export function addAdmonitionHeaders(tree: GenericParent) {
  visit(tree, 'admonition', (node: Admonition) => {
    if (!node.kind || node.kind === AdmonitionKind.admonition) return;
    node.children = [
      {
        type: 'admonitionTitle',
        children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
      },
      ...(node.children ?? []),
    ];
  });
}

// Visit all containers and add captions
export function addContainerCaptionNumbers(tree: GenericParent, state: State) {
  selectAll('container', tree)
    .filter((container: GenericNode) => container.enumerator !== false)
    .forEach((container: GenericNode) => {
      const enumerator = state.getTarget(container.identifier)?.node.enumerator;
      const para = select('caption > paragraph', container) as GenericNode;
      if (enumerator && para) {
        para.children = [
          { type: 'captionNumber', kind: container.kind, value: enumerator },
          ...(para?.children ?? []),
        ];
      }
    });
}

/**
 * Propagate target identifier/value to subsequent node
 *
 * Note: While this propagation happens regardless of the
 * subsequent node type, references are only resolved to
 * the TargetKind nodes enumerated in state.ts. For example:
 *
 * (paragraph-target)=
 * Just a normal paragraph
 *
 * will add identifier/label to paragraph node, but the node
 * will still not be targetable.
 */
export function propagateTargets(tree: GenericParent) {
  visit(tree, 'mystTarget', (node: GenericNode, index: number) => {
    const nextNode = findAfter(tree, index) as GenericNode;
    const normalized = normalizeLabel(node.label);
    if (nextNode && normalized) {
      nextNode.identifier = normalized.identifier;
      nextNode.label = normalized.label;
    }
  });
  remove(tree, 'mystTarget');
}

/**
 * Ensure caption content is nested in a paragraph.
 *
 * This function is idempotent!
 */
export function ensureCaptionIsParagraph(tree: GenericParent) {
  visit(tree, 'caption', (node: GenericNode) => {
    if (node.children && node.children[0].type !== 'paragraph') {
      node.children = [{ type: 'paragraph', children: node.children }];
    }
  });
}

export function convertHtmlToMdast(tree: GenericParent, opts?: HtmlToMdastOptions) {
  const handlers = { ...defaultHtmlToMdastOptions.htmlHandlers, ...opts?.htmlHandlers };
  const otherOptions = { ...defaultHtmlToMdastOptions, ...opts };
  const htmlNodes = selectAll('html', tree);
  htmlNodes.forEach((node: GenericNode) => {
    node.type = 'htmlParsed';
    node.children = htmlToMdast(node.value ?? '', {
      htmlHandlers: handlers,
      keepBreaks: otherOptions.keepBreaks,
      document: otherOptions.document,
    });
  });
  liftChildren(tree, 'htmlParsed');
  return tree;
}

export const transform: Plugin<[State, TransformOptions?], GenericParent> =
  (state, o) => (tree: GenericParent) => {
    const opts = {
      ...defaultOptions,
      ...o,
    };
    ensureCaptionIsParagraph(tree);
    propagateTargets(tree);
    enumerateTargets(state, tree, opts);
    resolveReferences(state, tree);
    liftChildren(tree, 'mystDirective');
    liftChildren(tree, 'mystRole');
    if (opts.addAdmonitionHeaders) addAdmonitionHeaders(tree);
    if (opts.addContainerCaptionNumbers) addContainerCaptionNumbers(tree, state);
  };
