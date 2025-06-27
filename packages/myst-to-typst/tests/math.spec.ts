import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import { u } from 'unist-builder';
import type { TypstResult } from '../src';
import mystToTypst from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe('myst-to-typst math', () => {
  it('includes recursive commands', () => {
    const tree = u('root', [u('paragraph', [u('inlineMath', { value: '\\aRecursion' })])]);
    const plugins = {
      '\\aNrm': { macro: 'a' },
      '\\aMat': { macro: '[\\mathrm{\\aNrm}]' },
      '\\aRecursion': { macro: '\\aMat' },
    };
    const pipe = unified().use(mystToTypst, {
      references: {},
      math: {
        ...plugins,
        '\\somethingElse': { macro: '\\blah' },
      },
    });
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as TypstResult).value).toEqual('$aRecursion$');
    expect((file.result as TypstResult).commands).toEqual({
      aRecursion: '[ upright(a) ]',
    });
  });

  it('uses typst value when provided', () => {
    const tree = u('root', [
      u('math', {
        value: 'latex',
        typst: 'typst',
      }),
    ]);
    const pipe = unified().use(mystToTypst);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as TypstResult).value).toEqual('$ typst $');
  });

  it('converts LaTeX when typst value not provided', () => {
    const tree = u('root', [u('math', { value: '\\mathrm{e}' })]);
    const pipe = unified().use(mystToTypst);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as TypstResult).value).toEqual('$ upright(e) $');
  });

  it('uses typst value for inline math when provided', () => {
    const tree = u('root', [
      u('paragraph', [
        u('inlineMath', {
          value: 'latex',
          typst: 'typst',
        }),
      ]),
    ]);
    const pipe = unified().use(mystToTypst);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as TypstResult).value).toEqual('$typst$');
  });

  it('converts LaTeX for inline math when typst value not provided', () => {
    const tree = u('root', [u('paragraph', [u('inlineMath', { value: '\\mathrm{e}' })])]);
    const pipe = unified().use(mystToTypst);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as TypstResult).value).toEqual('$upright(e)$');
  });
});
