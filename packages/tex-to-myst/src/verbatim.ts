import { u } from 'unist-builder';
import type { Handler } from './types.js';

export const VERBATIM_HANDLERS: Record<string, Handler> = {
  verbatim(node, state) {
    state.closeParagraph();
    const lines = node.content?.split('\n');
    if (lines?.[0].match(/^\[caption\s?=/)) {
      const caption = lines[0].replace(/^\[caption=\s?/, '').replace(/\s?\]$/, '');
      const code = lines.slice(1).join('\n');
      state.pushNode(
        u('container', { kind: 'code' }, [
          u('code', { value: code, lang: 'python' }),
          u('caption', [u('paragraph', [u('text', caption)])]),
        ]),
      );
      return;
    }
    state.pushNode(u('code', { value: node.content }));
  },
};
