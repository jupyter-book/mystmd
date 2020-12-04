import MarkdownIt from 'markdown-it';
import markdownTexMath from 'markdown-it-texmath';
import { Target } from './state';
import { toHTML } from './utils';

export const renderMath = (math: string, block: boolean, target?: Target) => {
  const { id, number } = target ?? {};
  const [html] = toHTML([block ? 'div' : 'span', {
    class: target ? ['math', 'numbered'] : 'math',
    id,
    number,
    children: block ? `\\[${math}\\]` : `\\(${math}\\)`,
  }], { inline: true });
  return block ? `${html}\n` : html;
};

export function addMathRenderers(md: MarkdownIt) {
  const { renderer } = md;
  renderer.rules.math_inline = (tokens, idx) => renderMath(tokens[idx].content, false);
  // Note: this will actually create invalid HTML
  renderer.rules.math_inline_double = (tokens, idx) => renderMath(tokens[idx].content, true);
  renderer.rules.math_block = (tokens, idx) => renderMath(tokens[idx].content, true);
  renderer.rules.math_block_end = () => ''
  renderer.rules.math_block_eqno = (tokens, idx) => (
    renderMath(tokens[idx].content, true, tokens[idx].meta?.target)
  );
  renderer.rules.math_block_eqno_end = () => ''
}

export function mathPlugin(md: MarkdownIt) {
  md.use(markdownTexMath, {
    engine: { renderToString: (s: string) => s }, // We are not going to render ever.
    delimiters: 'dollars',
  });
  // Note: numbering of equations for `math_block_eqno` happens in the directives rules
  addMathRenderers(md);
}
