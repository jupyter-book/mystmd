import { describe, expect, test } from 'vitest';
import type { GenericParent } from 'myst-common';
import { listItemParagraphsTransform } from './listItemParagraphs.js';

describe('listItemParagraphsTransform', () => {
  test('should wrap phrasing content in paragraph when only phrasing content exists', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                { type: 'text', value: 'simple text' },
                { type: 'inlineCode', value: 'code' },
              ],
            },
          ],
        },
      ],
    };

    listItemParagraphsTransform(tree);

    const listItem = tree.children[0].children[0];
    expect(listItem.children).toHaveLength(1);
    expect(listItem.children[0]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'simple text' },
        { type: 'inlineCode', value: 'code' },
      ],
    });
  });

  test('should handle list items with only flow content (no change)', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'blockquote',
                  children: [{ type: 'text', value: 'quoted content' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const originalTree = JSON.parse(JSON.stringify(tree));
    listItemParagraphsTransform(tree);

    // Should not change when only flow content (no phrasing content at top level)
    expect(tree).toEqual(originalTree);
  });

  test('should wrap phrasing content in paragraph when mixed with flow content', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                { type: 'text', value: 'inline ' },
                { type: 'inlineCode', value: 'code' },
                {
                  type: 'list',
                  ordered: false,
                  children: [
                    {
                      type: 'listItem',
                      children: [{ type: 'text', value: 'nested' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    listItemParagraphsTransform(tree);

    const listItem = tree.children[0].children[0];
    expect(listItem.children).toHaveLength(2);
    expect(listItem.children[0]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'inline ' },
        { type: 'inlineCode', value: 'code' },
      ],
    });
    expect(listItem.children[1].type).toBe('list');
  });

  test('should handle multiple consecutive phrasing content groups', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                { type: 'text', value: 'first group' },
                { type: 'emphasis', children: [{ type: 'text', value: 'emphasized' }] },
                {
                  type: 'list',
                  ordered: false,
                  children: [
                    {
                      type: 'listItem',
                      children: [{ type: 'text', value: 'nested' }],
                    },
                  ],
                },
                { type: 'text', value: 'second group' },
                { type: 'inlineCode', value: 'more code' },
                {
                  type: 'blockquote',
                  children: [{ type: 'text', value: 'quoted' }],
                },
              ],
            },
          ],
        },
      ],
    };

    listItemParagraphsTransform(tree);

    const listItem = tree.children[0].children[0];
    expect(listItem.children).toHaveLength(4);

    // First paragraph with first phrasing group
    expect(listItem.children[0]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'first group' },
        { type: 'emphasis', children: [{ type: 'text', value: 'emphasized' }] },
      ],
    });

    // Flow content (list) should be unchanged
    expect(listItem.children[1].type).toBe('list');

    // Second paragraph with second phrasing group
    expect(listItem.children[2]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'second group' },
        { type: 'inlineCode', value: 'more code' },
      ],
    });

    // Flow content (blockquote) should be unchanged
    expect(listItem.children[3].type).toBe('blockquote');
  });

  test('should handle phrasing content at the end of list item', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'list',
                  ordered: false,
                  children: [
                    {
                      type: 'listItem',
                      children: [{ type: 'text', value: 'nested' }],
                    },
                  ],
                },
                { type: 'text', value: 'text at end' },
                { type: 'inlineCode', value: 'code at end' },
              ],
            },
          ],
        },
      ],
    };

    listItemParagraphsTransform(tree);

    const listItem = tree.children[0].children[0];
    expect(listItem.children).toHaveLength(2);

    // Flow content should be first
    expect(listItem.children[0].type).toBe('list');

    // Paragraph with phrasing content should be last
    expect(listItem.children[1]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'text at end' },
        { type: 'inlineCode', value: 'code at end' },
      ],
    });
  });

  test('should handle empty list items (no change)', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [],
            },
          ],
        },
      ],
    };

    const originalTree = JSON.parse(JSON.stringify(tree));
    listItemParagraphsTransform(tree);

    expect(tree).toEqual(originalTree);
  });

  test('should handle list items with no children (no change)', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
            },
          ],
        },
      ],
    };

    const originalTree = JSON.parse(JSON.stringify(tree));
    listItemParagraphsTransform(tree);

    expect(tree).toEqual(originalTree);
  });

  test('should handle complex nested structures', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                { type: 'text', value: 'start ' },
                { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
                {
                  type: 'list',
                  ordered: true,
                  children: [
                    {
                      type: 'listItem',
                      children: [{ type: 'text', value: 'nested ordered' }],
                    },
                  ],
                },
                { type: 'inlineCode', value: 'middle' },
                {
                  type: 'blockquote',
                  children: [{ type: 'text', value: 'quoted content' }],
                },
                { type: 'text', value: ' end' },
                {
                  type: 'link',
                  url: 'http://example.com',
                  children: [{ type: 'text', value: 'link' }],
                },
              ],
            },
          ],
        },
      ],
    };

    listItemParagraphsTransform(tree);

    const listItem = tree.children[0].children[0];
    expect(listItem.children).toHaveLength(5);

    // First paragraph with first phrasing group
    expect(listItem.children[0]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'start ' },
        { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
      ],
    });

    // Flow content (list) should be unchanged
    expect(listItem.children[1].type).toBe('list');

    // Second paragraph with middle phrasing content
    expect(listItem.children[2]).toEqual({
      type: 'paragraph',
      children: [{ type: 'inlineCode', value: 'middle' }],
    });

    // Flow content (blockquote) should be unchanged
    expect(listItem.children[3].type).toBe('blockquote');

    // Third paragraph with final phrasing group
    expect(listItem.children[4]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: ' end' },
        { type: 'link', url: 'http://example.com', children: [{ type: 'text', value: 'link' }] },
      ],
    });
  });

  test('should handle all phrasing content types', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                { type: 'text', value: 'text' },
                { type: 'emphasis', children: [{ type: 'text', value: 'emphasis' }] },
                { type: 'strong', children: [{ type: 'text', value: 'strong' }] },
                { type: 'delete', children: [{ type: 'text', value: 'delete' }] },
                { type: 'inlineCode', value: 'inlineCode' },
                {
                  type: 'link',
                  url: 'http://example.com',
                  children: [{ type: 'text', value: 'link' }],
                },
                { type: 'image', url: 'image.png', alt: 'image' },
                { type: 'break' },
                {
                  type: 'list',
                  ordered: false,
                  children: [
                    {
                      type: 'listItem',
                      children: [{ type: 'text', value: 'nested' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    listItemParagraphsTransform(tree);

    const listItem = tree.children[0].children[0];
    expect(listItem.children).toHaveLength(2);

    // All phrasing content should be wrapped in one paragraph
    expect(listItem.children[0]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'text' },
        { type: 'emphasis', children: [{ type: 'text', value: 'emphasis' }] },
        { type: 'strong', children: [{ type: 'text', value: 'strong' }] },
        { type: 'delete', children: [{ type: 'text', value: 'delete' }] },
        { type: 'inlineCode', value: 'inlineCode' },
        { type: 'link', url: 'http://example.com', children: [{ type: 'text', value: 'link' }] },
        { type: 'image', url: 'image.png', alt: 'image' },
        { type: 'break' },
      ],
    });

    // Flow content should be unchanged
    expect(listItem.children[1].type).toBe('list');
  });

  test('should handle single phrasing content node', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [{ type: 'text', value: 'single text node' }],
            },
          ],
        },
      ],
    };

    listItemParagraphsTransform(tree);

    const listItem = tree.children[0].children[0];
    expect(listItem.children).toHaveLength(1);
    expect(listItem.children[0]).toEqual({
      type: 'paragraph',
      children: [{ type: 'text', value: 'single text node' }],
    });
  });

  test('should handle nested list items with phrasing content', () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'list',
                  ordered: true,
                  children: [
                    {
                      type: 'listItem',
                      children: [
                        { type: 'text', value: 'nested text' },
                        { type: 'inlineCode', value: 'nested code' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    listItemParagraphsTransform(tree);

    // The nested list item should have its phrasing content wrapped in a paragraph
    const nestedListItem = tree.children[0].children[0].children[0].children[0];
    expect(nestedListItem.children).toHaveLength(1);
    expect(nestedListItem.children[0]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', value: 'nested text' },
        { type: 'inlineCode', value: 'nested code' },
      ],
    });
  });
});
