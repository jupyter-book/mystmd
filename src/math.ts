/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it';
import markdownTexMath from 'markdown-it-texmath';
import { RenderRule } from 'markdown-it/lib/renderer';
import { RuleCore } from 'markdown-it/lib/parser_core';
import { newTarget, TargetKind, Target } from './state';
import { toHTML } from './utils';

const renderMath = (math: string, block: boolean, target?: Target) => {
  const { id, number } = target ?? {};
  const [html] = toHTML([block ? 'div' : 'span', {
    class: target ? ['math', 'numbered'] : 'math',
    id,
    number,
    children: block ? `\\[${math}\\]` : `\\(${math}\\)`,
  }], { inline: true });
  return block ? `${html}\n` : html;
};

export function addMathRenderer(md: MarkdownIt) {
  const inline: RenderRule = (tokens, idx) => renderMath(tokens[idx].content, false);
  // Note: this will actually create invalid HTML
  const inline_double: RenderRule = (tokens, idx) => renderMath(tokens[idx].content, true);
  const block: RenderRule = (tokens, idx) => renderMath(tokens[idx].content, true);
  const block_numbered: RenderRule = (tokens, idx) => (
    renderMath(tokens[idx].content, true, tokens[idx].meta?.target)
  );
  md.renderer.rules.math_inline = inline;
  md.renderer.rules.math_inline_double = inline_double;
  md.renderer.rules.math_block = block;
  md.renderer.rules.math_block_eqno = block_numbered;
}

const numberEquations: RuleCore = (state) => {
  const { tokens } = state;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'math_block_eqno') {
      const name = token.info;
      const target = newTarget(state, name, TargetKind.equation);
      token.meta = { ...token.meta, target };
    }
  }
  return true;
};

export function myst_math_plugin(md: MarkdownIt) {
  md.use(markdownTexMath, {
    engine: { renderToString: (s: string) => s }, // We are not going to render ever.
    delimiters: 'dollars',
  });
  md.core.ruler.after('block', 'number_equations', numberEquations);
  addMathRenderer(md);
}
