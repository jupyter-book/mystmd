import { describe, expect, it } from 'vitest';
import type { GenericParent } from 'myst-common';
import { headingDepthTransform } from './headings';

function mdastWithHeadings(depths: number[]): GenericParent {
  return {
    type: 'root',
    children: depths
      .map((depth: number) => {
        return [
          {
            type: 'heading',
            depth,
            children: [{ type: 'text', value: 'Heading!' }],
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Some text.' }],
          },
        ];
      })
      .flat(),
  };
}

describe('transformHeadings', () => {
  it('sequential heading depths pass', () => {
    const mdast = mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]);
    headingDepthTransform(mdast);
    expect(mdast).toEqual(mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]));
  });
  it('missing heading depths filled in', () => {
    const mdast = mdastWithHeadings([1, 2, 4, 1, 2, 1, 5]);
    headingDepthTransform(mdast);
    expect(mdast).toEqual(mdastWithHeadings([1, 2, 3, 1, 2, 1, 4]));
  });
  it('lowest depth becomes 1', () => {
    const mdast = mdastWithHeadings([2, 3]);
    headingDepthTransform(mdast);
    expect(mdast).toEqual(mdastWithHeadings([1, 2]));
  });
  it('missing heading depths filled in with explicit map', () => {
    const mdast = mdastWithHeadings([1, 2, 4, 1, 2, 1, 5]);
    headingDepthTransform(mdast, { headingDepthMap: [5, 0, 0, 3, 1, 0] });
    expect(mdast).toEqual(mdastWithHeadings([5, 2, 3, 5, 2, 5, 1]));
  });
});
