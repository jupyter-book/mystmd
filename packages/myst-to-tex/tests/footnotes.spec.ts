import type { FootnoteDefinition } from 'myst-spec-ext';
import { unified } from 'unified';
import { u } from 'unist-builder';
import type { LatexResult } from '../src';
import mystToTex from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe('myst-to-tex footnotes', () => {
  it('footnote reference/definition', () => {
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
