import { u } from 'unist-builder';
import type { Handler } from './types.js';

function parseFirstLine(code?: string) {
  const lines = code?.split('\n');
  const firstLine = lines?.[0];
  if (!firstLine) return { value: code?.replace(/(\s)$/, '') };
  if (!firstLine.match(/language([\s]*)?=/) && !firstLine.match(/caption([\s]*)?=/)) {
    return { value: code?.replace(/(\s)$/, '') };
  }
  const value = lines.slice(1).join('\n').replace(/(\s)$/, '');
  const caption = firstLine.match(/caption(?:[\s]*)?=([^,\]]*)/)?.[1].trim();
  const lang = firstLine.match(/language(?:[\s]*)?=([^,\]]*)/)?.[1].trim();
  return { caption, lang, value };
}

export const VERBATIM_HANDLERS: Record<string, Handler> = {
  verbatim(node, state) {
    state.closeParagraph();
    const { value, lang, caption } = parseFirstLine(node.content);
    if (caption) {
      state.pushNode(
        u('container', { kind: 'code' }, [
          u('code', { value, lang }),
          u('caption', [u('paragraph', [u('text', caption)])]),
        ]),
      );
      return;
    }
    state.pushNode(u('code', { value, lang }));
  },
};
