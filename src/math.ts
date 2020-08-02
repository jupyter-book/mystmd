/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it';
import markdownTexMath from 'markdown-it-texmath';
import { RenderRule } from 'markdown-it/lib/renderer';
import { RuleCore } from 'markdown-it/lib/parser_core';
import { newEquation } from './state';

export function addMathRenderer(md: MarkdownIt) {
  const inline: RenderRule = (tokens, idx) => `<span class="math">\\(${tokens[idx].content}\\)</span>`;
  // Note: this will actually create invalid HTML
  const inline_double: RenderRule = (tokens, idx) => `<div class="math">\\[${tokens[idx].content}\\]</div>`;
  const block: RenderRule = (tokens, idx) => `<div class="math">\\[${tokens[idx].content}\\]</div>\n`;
  const block_numbered: RenderRule = (tokens, idx) => {
    const token = tokens[idx];
    const name = token.attrGet('name');
    const number = token.attrGet('number');
    return `<div class="math" id="${name}">\\[${token.content}\\] (${number})</div>\n`;
  };
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
      const id = token.info;
      const target = newEquation(state, id);
      token.attrSet('name', target.name);
      token.attrSet('number', `${target.number}`);
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
