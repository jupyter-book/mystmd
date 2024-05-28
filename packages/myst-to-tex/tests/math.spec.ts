import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import { u } from 'unist-builder';
import type { LatexResult } from '../src';
import mystToTex from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe('myst-to-tex math', () => {
  it('includes recursive commands', () => {
    const tree = u('root', [u('paragraph', [u('inlineMath', { value: '\\aRecursion' })])]);
    const plugins = {
      '\\aNrm': { macro: 'a' },
      '\\aMat': { macro: '[\\mathrm{\\aNrm}]' },
      '\\aRecursion': { macro: '\\aMat' },
    };
    const pipe = unified().use(mystToTex, {
      references: {},
      math: {
        ...plugins,
        '\\somethingElse': { macro: '\\blah' },
      },
    });
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as LatexResult).value).toEqual('$\\aRecursion$');
    expect((file.result as LatexResult).commands).toEqual({
      '\\aNrm': 'a',
      '\\aMat': '[\\mathrm{\\aNrm}]',
      '\\aRecursion': '\\aMat',
    });
  });
  it.each([
    [false, 'start\n\n\\begin{equation}\nAx=b\n\\end{equation}\n\nend'],
    ['before', 'start\n\\begin{equation}\nAx=b\n\\end{equation}\n\nend'],
    ['after', 'start\n\n\\begin{equation}\nAx=b\n\\end{equation}\nend'],
    [true, 'start\n\\begin{equation}\nAx=b\n\\end{equation}\nend'],
  ])('works with tight math %s', (tight, tex) => {
    const tree = u('root', [
      u('paragraph', [u('text', 'start')]),
      u('math', { value: 'Ax=b', tight }),
      u('paragraph', [u('text', 'end')]),
    ]);
    const pipe = unified().use(mystToTex);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as LatexResult).value).toEqual(tex);
  });
});
