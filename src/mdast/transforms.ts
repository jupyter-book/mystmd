import { Root } from 'mdast';
import { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAfter } from 'unist-util-find-after';
import { remove } from 'unist-util-remove';
import { map } from 'unist-util-map';
import { Admonition, AdmonitionKind, GenericNode } from './types';
import { admonitionKindToTitle } from './utils';
import { State, countState, referenceState } from './state';

export type Options = {
  addAdmonitionHeaders?: boolean;
  addContainerCaptionNumbers?: boolean;
};

const defaultOptions: Record<keyof Options, true> = {
  addAdmonitionHeaders: true,
  addContainerCaptionNumbers: true,
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
  selectAll('container[numbered=true]', tree).forEach((container: GenericNode) => {
    const number = state.getTarget(container.identifier)?.number;
    const para = select('caption > paragraph', container) as GenericNode;
    if (number && para) {
      para.children = [
        { type: 'captionNumber', kind: container.kind, value: number },
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
    node.children = children;
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
  visit(tree, 'target', (node: GenericNode) => {
    const nextNode = findAfter(tree, node) as GenericNode;
    if (nextNode) {
      nextNode.identifier = node.identifier;
      nextNode.label = node.label;
    }
  });
  remove(tree, 'target');
}

export const transform: Plugin<[State, Options?], string, Root> =
  (state, o) => (tree: Root) => {
    const opts = {
      ...defaultOptions,
      ...o,
    };
    propagateTargets(tree);
    countState(state, tree);
    referenceState(state, tree);
    liftChildren(tree, 'directive');
    liftChildren(tree, 'role');
    if (opts.addAdmonitionHeaders) addAdmonitionHeaders(tree);
    if (opts.addContainerCaptionNumbers) addContainerCaptionNumbers(tree, state);
  };
