/* eslint-disable no-param-reassign */
import MarkdownIt from 'markdown-it';
import { RenderRule } from 'markdown-it/lib/renderer';


export function addMathRenderer(md: MarkdownIt) {
  const inline: RenderRule = (tokens, idx) => `<span class="math">\\(${tokens[idx].content}\\)</span>`;
  // Note: this will actually create invalid HTML
  const inline_double: RenderRule = (tokens, idx) => `<div class="math">\\[${tokens[idx].content}\\]</div>`;
  const block: RenderRule = (tokens, idx) => `<div class="math">\\[${tokens[idx].content}\\]</div>\n`;
  const block_numbered: RenderRule = (tokens, idx) => `<div class="math">\\[${tokens[idx].content}\\]</div>\n`;
  md.renderer.rules.math_inline = inline;
  md.renderer.rules.math_inline_double = inline_double;
  md.renderer.rules.math_block = block;
  md.renderer.rules.math_block_eqno = block_numbered;
}
