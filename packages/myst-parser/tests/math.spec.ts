import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import { mystParse } from '../src';
import { mathNestingTransform } from 'myst-transforms';
import { select } from 'unist-util-select';
import type { Math } from 'myst-spec-ext';

describe('Test math tightness', () => {
  test.each([
    [true, 'p\n$$Ax=b$$\np'],
    [undefined, 'p\n\n$$Ax=b$$\n\np'],
    ['before', 'p\n$$Ax=b$$\n\np'],
    // ['after', 'p\n\n$$Ax=b$$\np'], // TODO: this is (maybe) a bug in the dollar-math parser
    [undefined, 'p\n\n$$Ax=b$$'],
  ])('double-math %s', (tight, src) => {
    const file = new VFile();
    const tree = mystParse(src);
    expect((select('math', tree) as Math).tight).toBe(undefined);
    mathNestingTransform(tree, file);
    expect((select('math', tree) as Math).tight).toBe(tight);
  });
  test.each([
    [true, 'p\n:::{math}\nAx=b\n:::\np'],
    [undefined, 'p\n\n:::{math}\nAx=b\n:::\n\np'],
    ['before', 'p\n:::{math}\nAx=b\n:::\n\np'],
    ['after', 'p\n\n:::{math}\nAx=b\n:::\np'],
    [undefined, 'p\n\n:::{math}\nAx=b\n:::'],
  ])('math directive %s', (tight, src) => {
    const tree = mystParse(src);
    expect((select('math', tree) as Math)?.tight).toBe(tight);
  });
  test.each([
    // [true, 'a\n\\begin{equation}\nAx=b\n\\end{equation}\nb'],
    [undefined, 'a\n\n\\begin{equation}\nAx=b\n\\end{equation}\n\nb'],
    ['before', 'p\n\\begin{equation}\nAx=b\n\\end{equation}\n\np'],
    ['after', 'p\n\n\\begin{equation}\nAx=b\n\\end{equation}\np'],
    [undefined, 'p\n\n\\begin{equation}\nAx=b\n\\end{equation}'],
  ])('amsmath %s', (tight, src) => {
    const tree = mystParse(src);
    expect((select('math', tree) as Math)?.tight).toBe(tight);
  });
});
