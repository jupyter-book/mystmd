import MarkdownIt from 'markdown-it';
import { myst_role_plugin } from './myst_roles';
import { myst_directives_plugin } from './myst_directives';

const tokenizer = MarkdownIt('commonmark', { html: false });
tokenizer.use(myst_role_plugin);
tokenizer.use(myst_directives_plugin);

const sameF = (md: string, html: string) => expect(tokenizer.render(md)).toEqual(`${html}\n`);
const sameI = (md: string, html: string) => expect(tokenizer.renderInline(md)).toEqual(html);

// TODO: Spin this out into fixtures

describe('Markdown', () => {
  it('parses a paragraph', () => sameF('hello!', '<p>hello!</p>'));
  it('parses a paragraph', () => sameI('hello!', 'hello!'));
  it('parses myst math', () => sameI(
    'Best matrix equation is {math}`Ax = b`',
    'Best matrix equation is <span class="math">Ax = b</span>',
  ));
  it('parses myst abbr', () => sameI(
    'Well {abbr}`CSS (Cascading Style Sheets)` is cool?',
    'Well <abbr title="Cascading Style Sheets">CSS</abbr> is cool?',
  ));
  it('parses myst admonitions, ``` style', () => sameF(
    '```{warning} This is\n*directive* content\n```',
    '<aside class="callout warning"><header>Warning</header>\n<p>This is <em>directive</em> content</p>\n</aside>',
  ));
  it('parses myst admonitions, ::: style', () => sameF(
    ':::warning\nThis is *directive* content\n:::',
    '<aside class="callout warning"><header>Warning</header>\n<p>This is <em>directive</em> content</p>\n</aside>',
  ));
});
