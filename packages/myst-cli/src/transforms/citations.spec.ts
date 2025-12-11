import { describe, expect, it } from 'vitest';
import { Session } from '../session';
import { transformCitations } from './citations';
import type { CitationRenderer } from 'citation-js-utils';
import type { References } from 'myst-common';

const RENDERER: CitationRenderer = {
  author1: {
    render: () => '<rendered 1/>',
    inline: () => {
      return [{ type: 'text', value: 'inline 1' }];
    },
    getDOI: () => 'abc123',
    getURL: () => 'https://example.com',
    cite: { id: 'my-cite-1' },
  },
  author2: {
    render: () => '<rendered 2/>',
    inline: () => {
      return [{ type: 'text', value: 'inline 2' }];
    },
    getDOI: () => undefined,
    getURL: () => undefined,
    cite: { id: 'my-cite-2' },
  },
};

describe('transformCitations', () => {
  it('citation transforms', async () => {
    const mdast: any = {
      type: 'root',
      children: [
        {
          type: 'cite',
          label: 'author1',
        },
      ],
    };
    const references: References = {};
    transformCitations(new Session(), '', mdast, RENDERER, references);
    expect(mdast.children[0].children).toEqual([{ type: 'text', value: 'inline 1' }]);
    expect(mdast.children[0].enumerator).toEqual('1');
    expect(references.cite?.order).toEqual(['author1']);
    expect(references.cite?.data?.author1).toEqual({
      label: 'author1',
      doi: 'abc123',
      url: 'https://example.com',
      enumerator: '1',
      html: '<rendered 1/>',
    });
  });
  it('multiple citations transform', async () => {
    const mdast: any = {
      type: 'root',
      children: [
        {
          type: 'cite',
          label: 'author2',
        },
        {
          type: 'cite',
          label: 'author1',
        },
        {
          type: 'cite',
          label: 'author2',
        },
      ],
    };
    const references: References = {};
    transformCitations(new Session(), '', mdast, RENDERER, references);
    expect(mdast.children[0].children).toEqual([{ type: 'text', value: 'inline 2' }]);
    expect(mdast.children[0].enumerator).toEqual('1');
    expect(mdast.children[1].children).toEqual([{ type: 'text', value: 'inline 1' }]);
    expect(mdast.children[1].enumerator).toEqual('2');
    expect(mdast.children[2].children).toEqual([{ type: 'text', value: 'inline 2' }]);
    expect(mdast.children[2].enumerator).toEqual('1');
    expect(references.cite?.order).toEqual(['author2', 'author1']);
    expect(references.cite?.data?.author1).toEqual({
      label: 'author1',
      doi: 'abc123',
      url: 'https://example.com',
      enumerator: '2',
      html: '<rendered 1/>',
    });
    expect(references.cite?.data?.author2).toEqual({
      label: 'author2',
      enumerator: '1',
      html: '<rendered 2/>',
    });
  });
});
