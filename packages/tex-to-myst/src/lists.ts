import type { GenericNode } from 'myst-common';
import { copyNode } from 'myst-common';
import type { Handler } from './types.js';
import { renderInfoIndex, texToText, unnestParagraphs } from './utils.js';

export const LIST_HANDLERS: Record<string, Handler> = {
  env_enumerate(node, state) {
    const prev = state.data.listType;
    state.data.listType = 'list';
    state.renderBlock(node, 'list', { ordered: true });
    if (texToText(node.args[0]) === 'noitemsep') {
      unnestParagraphs(state.top(), 'listItem');
    }
    state.data.listType = prev;
  },
  env_itemize(node, state) {
    const prev = state.data.listType;
    state.data.listType = 'list';
    state.renderBlock(node, 'list', { ordered: false });
    if (texToText(node.args[0]) === 'noitemsep') {
      unnestParagraphs(state.top(), 'listItem');
    }
    state.data.listType = prev;
  },
  env_description(node, state) {
    const prev = state.data.listType;
    state.data.listType = 'definition';
    state.renderBlock(node, 'definitionList');
    unnestParagraphs(state.top(), 'definitionTerm,definitionDescription');
    state.data.listType = prev;
  },
  env_labeling(node, state) {
    const copy = copyNode(node);
    const group = copy.content.slice(0, 1)[0];
    if (group.type !== 'group') {
      state.warn(
        `Expected the labelling environment to start with a group, not ${group.type}`,
        group,
      );
    }
    const items = copy.content.slice(1).reduce((l: GenericNode[], n: GenericNode) => {
      const last = l[l.length - 1];
      if (!last) return [n];
      if (!last && n.type === 'whitespace') return []; // eat the first whitespace
      if (n.type === 'macro' && n.content === 'item') {
        // push the item
        return [...l, n];
      }
      last.args[last.args.length - 1].content.push(n);
      return l;
    }, [] as GenericNode[]);
    const prev = state.data.listType;
    state.data.listType = 'definition';
    state.renderBlock({ type: '', content: items }, 'definitionList');
    unnestParagraphs(state.top(), 'definitionTerm,definitionDescription');
    state.data.listType = prev;
  },
  macro_item(node, state) {
    if (state.data.listType === 'definition') {
      const label = node.args[renderInfoIndex(node, 'label')];
      const content = node.args[node.args.length - 1];
      state.renderBlock(label, 'definitionTerm');
      state.renderBlock(content, 'definitionDescription');
      return;
    }
    // TODO: we can expand this to have the type of the latex list, etc.
    const content = node.args[node.args.length - 1];
    state.renderBlock(content, 'listItem');
  },
};
