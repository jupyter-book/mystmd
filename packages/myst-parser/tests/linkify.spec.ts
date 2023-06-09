import { describe, expect, it } from 'vitest';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { mystParse } from '../src';

function stripPositions(tree: Root) {
  visit(tree, (node) => {
    delete node.position;
  });
  return tree;
}

describe('linkify', () => {
  it('linkify in paragraph', () => {
    const content = 'Link in paragraph: example.com';
    expect(stripPositions(mystParse(content))).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Link in paragraph: example.com' }],
        },
      ],
    });
    expect(stripPositions(mystParse(content, { markdownit: { linkify: true } }))).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Link in paragraph: ' },
            {
              type: 'link',
              url: 'http://example.com',
              children: [{ type: 'text', value: 'example.com' }],
            },
          ],
        },
      ],
    });
  });
  it('linkify in heading', () => {
    const content = '# Link in heading: example.com';
    expect(stripPositions(mystParse(content))).toEqual({
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [{ type: 'text', value: 'Link in heading: example.com' }],
        },
      ],
    });
    expect(stripPositions(mystParse(content, { markdownit: { linkify: true } }))).toEqual({
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [
            { type: 'text', value: 'Link in heading: ' },
            {
              type: 'link',
              url: 'http://example.com',
              children: [{ type: 'text', value: 'example.com' }],
            },
          ],
        },
      ],
    });
  });
  it('dont linkify in link', () => {
    const content = 'Link in link: [example.com](https://example.com)';
    expect(stripPositions(mystParse(content))).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Link in link: ' },
            {
              type: 'link',
              url: 'https://example.com',
              children: [{ type: 'text', value: 'example.com' }],
            },
          ],
        },
      ],
    });
    expect(stripPositions(mystParse(content, { markdownit: { linkify: true } }))).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Link in link: ' },
            {
              type: 'link',
              url: 'https://example.com',
              children: [{ type: 'text', value: 'example.com' }],
            },
          ],
        },
      ],
    });
  });
});
