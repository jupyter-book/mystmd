import MarkdownIt from 'markdown-it';
import { myst_role_plugin } from './roles';
import { myst_directives_plugin } from './directives';
import { myst_blocks_plugin } from './myst_blocks';
import { myst_math_plugin } from './math';
import directives from './directives/default';
import roles from './roles/default';
import { Directives } from './directives/types';
import { Roles } from './roles/types';

export type Options = {
  directives: Directives;
  roles: Roles;
};

const defaultOptions: Options = { directives, roles };

export default function MyST(opts: Options = defaultOptions) {
  const tokenizer = MarkdownIt('commonmark', { html: false });
  tokenizer.use(myst_math_plugin);
  tokenizer.use(myst_role_plugin(roles));
  tokenizer.use(myst_directives_plugin(opts.directives));
  tokenizer.use(myst_blocks_plugin);
  return tokenizer;
}
