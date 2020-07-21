import fs from 'fs';
import MarkdownIt from 'markdown-it';
import { myst_role_plugin } from '../src/myst_roles';
import { myst_directives_plugin } from '../src/myst_directives';
import { myst_blocks_plugin } from '../src/myst_blocks';

export function getFixtures(name: string) {
  const fixtures = fs.readFileSync(`fixtures/${name}.md`).toString();
  return fixtures.split('\n.\n\n').map((s) => s.split('\n.\n'));
}

export function getTokenizer() {
  const tokenizer = MarkdownIt('commonmark', { html: false });
  tokenizer.use(myst_role_plugin);
  tokenizer.use(myst_directives_plugin);
  tokenizer.use(myst_blocks_plugin);
  return tokenizer;
}
