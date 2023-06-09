import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import { u } from 'unist-builder';
import type { LatexResult } from '../src';
import mystToTex from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe('myst-to-tex math', () => {
  it('includes recursive commands', () => {
    const tree = u('root', [u('paragraph', [u('inlineMath', { value: '\\aRecursion' })])]);
    const plugins = { '\\aNrm': 'a', '\\aMat': '[\\mathrm{\\aNrm}]', '\\aRecursion': '\\aMat' };
    const pipe = unified().use(mystToTex, {
      references: {},
      math: {
        ...plugins,
        '\\somethingElse': '\\blah',
      },
    });
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as LatexResult).value).toEqual('$\\aRecursion$');
    expect((file.result as LatexResult).commands).toEqual(plugins);
  });
});
