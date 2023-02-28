import type { FootnoteDefinition } from 'myst-spec-ext';
import { unified } from 'unified';
import { u } from 'unist-builder';
import type { LatexResult } from '../src';
import mystToTex from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const everything =
  'Some *markdown* $Ax=b$\n\nok\n\n# Heading\n\n```\npython\n```\n\n* hello `code`\n* hi\n\n> ok\n\n---\n\n2. ok\n\n% comment\n\n$$math$$\n\n| header 1 | header 2 |\n|:---|---:|\n| $$3$$ | ok |\n\nH{sub}`2`O\n\n```{note}\nok\n```\n\n```{figure} image.png\n:name: hi\nSome caption\n```\n\nIn {numref}`Fig. %s <hi>`';

describe('myst-to-tex', () => {
  it('emphasis in paragraph', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('emphasis', [u('text', { value: 'markdown' })]),
      ]),
    );
    const pipe = unified().use(mystToTex);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect((file.result as LatexResult).value).toEqual('Some \\% \\textit{markdown}');
  });
  it('escapes quotes and unicode', () => {
    const tree = u(
      'root',
      u('paragraph', [u('text', { value: '“quote” ' }), u('inlineMath', { value: '½' })]),
    );
    const pipe = unified().use(mystToTex);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect((file.result as LatexResult).value).toEqual("``quote'' $\\frac{1}{2}$");
  });
  it('comment', () => {
    const tree = u('root', [u('comment', 'hello\nworld')]);
    const pipe = unified().use(mystToTex);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as LatexResult).value).toEqual('% hello\n% world');
  });
  it('footnote', () => {
    const tree = u('root', [
      u('paragraph', [
        u('text', 'hello'),
        u('footnoteReference', { identifier: 1 }),
        u('text', 'world'),
      ]),
    ]);
    const pipe = unified().use(mystToTex, {
      references: {
        footnotes: {
          '1': u('footnoteDefinition', { identifier: '1' }, [
            u('paragraph', [u('text', 'tex')]),
          ]) as FootnoteDefinition,
        },
      },
    });
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as LatexResult).value).toEqual('hello\\footnote{tex}world');
  });
});
