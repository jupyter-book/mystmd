import { beforeEach, describe, expect, it } from 'vitest';
import { VFile } from 'vfile';
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

let vfile: VFile;

beforeEach(() => {
  vfile = new VFile();
});

describe('headingDepthTransform', () => {
  it('sequential heading depths default to firstDepth = 1', () => {
    const mdast = mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]);
    headingDepthTransform(mdast, vfile);
    expect(mdast).toEqual(mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]));
    expect(vfile.messages.length).toBe(0);
  });
  it('zero firstDepth ignored', () => {
    const mdast = mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]);
    headingDepthTransform(mdast, vfile, { firstDepth: 0 });
    expect(mdast).toEqual(mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]));
    expect(vfile.messages.length).toBe(0);
  });
  it('missing heading depths filled in', () => {
    const mdast = mdastWithHeadings([1, 2, 4, 1, 2, 1, 5]);
    headingDepthTransform(mdast, vfile);
    expect(mdast).toEqual(mdastWithHeadings([1, 2, 3, 1, 2, 1, 4]));
    expect(vfile.messages.length).toBe(1);
  });
  it('lowest depth becomes 2', () => {
    const mdast = mdastWithHeadings([3, 4]);
    headingDepthTransform(mdast, vfile);
    expect(mdast).toEqual(mdastWithHeadings([1, 2]));
    expect(vfile.messages.length).toBe(0);
  });
  it('too deep heading coerces to 6 and warns', () => {
    const mdast = mdastWithHeadings([2, 3]);
    headingDepthTransform(mdast, vfile, { firstDepth: 6 });
    expect(mdast).toEqual(mdastWithHeadings([6, 6]));
    expect(vfile.messages.length).toBe(1);
  });
  it('firstDepth shifts depths', () => {
    const mdast = mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]);
    headingDepthTransform(mdast, vfile, { firstDepth: 4 });
    expect(mdast).toEqual(mdastWithHeadings([4, 5, 6, 4, 5, 4, 5]));
    expect(vfile.messages.length).toBe(0);
  });
  it('negative firstDepth ignored', () => {
    const mdast = mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]);
    headingDepthTransform(mdast, vfile, { firstDepth: -1 });
    expect(mdast).toEqual(mdastWithHeadings([1, 2, 3, 1, 2, 1, 2]));
    expect(vfile.messages.length).toBe(0);
  });
});
