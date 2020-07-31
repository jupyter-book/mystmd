import MarkdownIt from 'markdown-it';
import { myst_role_plugin } from './myst_roles';
import { myst_directives_plugin } from './myst_directives';
import { myst_blocks_plugin } from './myst_blocks';
import { myst_math_plugin } from './math';

export default function MyST() {
  const tokenizer = MarkdownIt('commonmark', { html: false });
  tokenizer.use(myst_math_plugin);
  tokenizer.use(myst_role_plugin);
  tokenizer.use(myst_directives_plugin);
  tokenizer.use(myst_blocks_plugin);
  return tokenizer;
}
