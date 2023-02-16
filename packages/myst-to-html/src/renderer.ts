import type MarkdownIt from 'markdown-it';
import type { TargetKind } from 'myst-transforms';
import { toHTML } from './utils';

type Target = {
  id: string;
  name: string;
  kind: TargetKind;
  defaultReference: string;
  title?: string;
  number?: number;
};

export const renderMath = (math: string, block: boolean, target?: Target): string => {
  const { id, number } = target ?? {};
  const [html] = toHTML(
    [
      block ? 'div' : 'span',
      {
        class: target ? ['math', 'numbered'] : 'math',
        id,
        number,
        children: block ? `\\[\n${math}\n\\]` : `\\(${math}\\)`,
      },
    ],
    { inline: true },
  );
  return block ? `${html}\n` : html;
};

export function addMathRenderers(md: MarkdownIt): void {
  const { renderer } = md;
  renderer.rules.math_inline = (tokens, idx) => renderMath(tokens[idx].content, false);
  // Note: this will actually create invalid HTML
  renderer.rules.math_inline_double = (tokens, idx) => renderMath(tokens[idx].content, true);
  renderer.rules.math_block = (tokens, idx) => renderMath(tokens[idx].content, true);
  renderer.rules.math_block_label = (tokens, idx) =>
    renderMath(tokens[idx].content, true, tokens[idx].meta?.target);
}
