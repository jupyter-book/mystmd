import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import { u } from 'unist-builder';
import type { LatexResult } from '../src';
import mystToTex from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe('myst-to-tex siunitx', () => {
  it('footnote reference/definition', () => {
    const tree = u('root', [
      u('paragraph', [
        u('si', { units: ['milli', 'meter'], alt: 'mili meter', value: '1 mm', number: '1' }),
      ]),
    ]);
    const pipe = unified().use(mystToTex, {
      references: {},
    });
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as LatexResult).value).toEqual('\\qty{1}{\\milli\\meter}');
  });
});
