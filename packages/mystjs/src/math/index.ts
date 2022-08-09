import MarkdownIt from 'markdown-it';
import { dollarmathPlugin } from 'markdown-it-dollarmath';
import { amsmathPlugin } from 'markdown-it-amsmath';
import { renderMath } from './utils';

export type MathExtensionOptions = {
  amsmath?: boolean;
  dollarmath?: boolean;
};

export function addMathRenderers(md: MarkdownIt): void {
  const { renderer } = md;
  renderer.rules.math_inline = (tokens, idx) => renderMath(tokens[idx].content, false);
  // Note: this will actually create invalid HTML
  renderer.rules.math_inline_double = (tokens, idx) =>
    renderMath(tokens[idx].content, true);
  renderer.rules.math_block = (tokens, idx) => renderMath(tokens[idx].content, true);
  renderer.rules.math_block_label = (tokens, idx) =>
    renderMath(tokens[idx].content, true, tokens[idx].meta?.target);
}

export function plugin(md: MarkdownIt, options?: true | MathExtensionOptions): void {
  const opts = options === true ? { amsmath: true, dollarmath: true } : options;
  if (opts?.dollarmath) dollarmathPlugin(md);
  if (opts?.amsmath)
    amsmathPlugin(md, {
      renderer: (content) => renderMath(content, true),
    });
  // Note: numbering of equations for `math_block_label` happens in the directives rules
  addMathRenderers(md);
}
