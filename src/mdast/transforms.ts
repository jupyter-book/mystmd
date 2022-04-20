import { Root } from 'mdast';
import { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAfter } from 'unist-util-find-after';
import { remove } from 'unist-util-remove';
import { map } from 'unist-util-map';
import { Admonition, AdmonitionKind, GenericNode } from './types';
import { admonitionKindToTitle, normalizeLabel } from './utils';
import { EnumeratorOptions, State, enumerateTargets, resolveReferences } from './state';

export type Options = {
  addAdmonitionHeaders?: boolean;
  addContainerCaptionNumbers?: boolean;
} & EnumeratorOptions;

const defaultOptions: Record<keyof Options, boolean> = {
  addAdmonitionHeaders: true,
  addContainerCaptionNumbers: true,
  noHeadingEnumeration: false,
  noContainerEnumeration: false,
  noEquationEnumeration: false,
};

// Visit all admonitions and add headers if necessary
export function addAdmonitionHeaders(tree: Root) {
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
export function addContainerCaptionNumbers(tree: Root, state: State) {
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

export function liftChildren(tree: Root, nodeType: string) {
  map(tree, (node: GenericNode) => {
    const children = node.children
      ?.map((child: GenericNode) => {
        if (child.type === nodeType && child.children) return child.children;
        return child;
      })
      ?.flat();
    if (children !== undefined) node.children = children;
    return node;
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

export function propagateTargets(tree: Root) {
  visit(tree, 'mystTarget', (node: GenericNode) => {
    const nextNode = findAfter(tree, node) as GenericNode;
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
export function ensureCaptionIsParagraph(tree: Root) {
  visit(tree, 'caption', (node: GenericNode) => {
    if (node.children && node.children[0].type !== 'paragraph') {
      node.children = [{ type: 'paragraph', children: node.children }];
    }
  });
}

export const transform: Plugin<[State, Options?], string, Root> =
  (state, o) => (tree: Root) => {
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
