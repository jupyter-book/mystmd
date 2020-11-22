import MarkdownIt from 'markdown-it';
import { rolePlugin } from './roles';
import { directivesPlugin } from './directives';
import { blocksPlugin } from './blocks';
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
  tokenizer.use(blocksPlugin);
  tokenizer.use(directivesPlugin(opts.directives));
  tokenizer.use(rolePlugin(opts.roles));
  return tokenizer;
}
