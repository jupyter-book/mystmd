import MarkdownIt from 'markdown-it';
import { rolePlugin } from './roles';
import { directivesPlugin } from './directives';
import { blocksPlugin } from './blocks';
import { mathPlugin } from './math';
import directives from './directives/default';
import roles from './roles/default';
import { Directives } from './directives/types';
import { Roles } from './roles/types';

export type Options = {
  directives: Directives;
  roles: Roles;
  math?: boolean;
};

const defaultPlugins: Options = { directives, roles, math: true };
const defaultOpts: MarkdownIt.Options = { html: false };

export default function MyST(
  plugins: Options = defaultPlugins,
  opts: MarkdownIt.Options | undefined = defaultOpts,
) {
  const tokenizer = MarkdownIt('commonmark', opts);
  if (plugins.math) tokenizer.use(mathPlugin);
  tokenizer.use(blocksPlugin);
  tokenizer.use(directivesPlugin(plugins.directives));
  tokenizer.use(rolePlugin(plugins.roles));
  return tokenizer;
}
