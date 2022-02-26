import { Root } from 'mdast';
import { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
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

export const transform: Plugin<[State, Options?], string, Root> =
  (state, o) => (tree: Root) => {
    const opts = {
      ...defaultOptions,
      ...o,
    };
    countState(state, tree);
    referenceState(state, tree);
    if (opts.addAdmonitionHeaders) addAdmonitionHeaders(tree);
    if (opts.addContainerCaptionNumbers) addContainerCaptionNumbers(tree, state);
  };
