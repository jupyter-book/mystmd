import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import { mystParse } from 'myst-parser';
import { u } from 'unist-builder';
import type { LatexResult } from '../src';
import mystToTex from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe('end-to-end smart quotes', () => {
  it('smartquotes', () => {
    const tree = mystParse(`"foo 'bar' baz" (c)`);
    const pipe = unified().use(mystToTex, {
      references: {},
    });
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect((file.result as LatexResult).value).toEqual("``foo `bar' baz'' (c)");
  });
});
