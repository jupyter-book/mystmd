import MarkdownIt from 'markdown-it';
import markdownTexMath from 'markdown-it-texmath';
import { myst_role_plugin } from './myst_roles';
import { myst_directives_plugin } from './myst_directives';
import { myst_blocks_plugin } from './myst_blocks';
import { addMathRenderer } from './math_renderer';

export default function MyST() {
  const tokenizer = MarkdownIt('commonmark', { html: false });
  tokenizer.use(markdownTexMath, {
    engine: { renderToString: (s: string) => s }, // We are not going to render ever.
    delimiters: 'dollars',
  });
  addMathRenderer(tokenizer);
  tokenizer.use(myst_role_plugin);
  tokenizer.use(myst_directives_plugin);
  tokenizer.use(myst_blocks_plugin);
  return tokenizer;
}
