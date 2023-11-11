import { describe, expect, it } from 'vitest';
import type { GenericParent } from 'myst-common';
import { Session } from '../../session';
import { extractTexPart } from './single';

describe('extractTexPart', () => {
  it('no tagged part returns undefined', async () => {
    expect(
      extractTexPart(
        new Session(),
        { type: 'root', children: [{ type: 'text', value: 'untagged content' }] },
        {},
        { id: 'test_tag', required: true },
        {},
        { myst: 'v1' },
      ),
    ).toEqual(undefined);
  });
  it('tagged part removed from tree and returned', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['other_tag'] },
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [{ type: 'text', value: 'tagged content' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_tag', tags: ['other_tag'] },
          children: [{ type: 'text', value: 'also tagged content' }],
        },
      ],
    };
    expect(extractTexPart(new Session(), tree, {}, { id: 'test_tag' }, {}, { myst: 'v1' })).toEqual(
      {
        value: 'tagged content\n\nalso tagged content',
        imports: [],
        commands: {},
        preamble: '',
      },
    );
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['other_tag'] },
          children: [{ type: 'text', value: 'untagged content' }],
        },
      ],
    });
  });
  it('tagged part meeting maximums passes', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(
      extractTexPart(
        new Session(),
        tree,
        {},
        { id: 'test_tag', max_chars: 1000, max_words: 100 },
        {},
        { myst: 'v1' },
      ),
    ).toEqual({
      value: 'tagged content',
      imports: [],
      commands: {},
      preamble: '',
    });
  });
  it('exceeding max chars passes', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(
      extractTexPart(new Session(), tree, {}, { id: 'test_tag', max_chars: 5 }, {}, { myst: 'v1' }),
    ).toEqual({
      value: 'tagged content',
      imports: [],
      commands: {},
      preamble: '',
    });
  });
  it('exceeding max words passes', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(
      extractTexPart(new Session(), tree, {}, { id: 'test_tag', max_words: 1 }, {}, { myst: 'v1' }),
    ).toEqual({
      value: 'tagged content',
      imports: [],
      commands: {},
      preamble: '',
    });
  });
  it('part as_list returns list', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [{ type: 'text', value: 'tagged content' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [{ type: 'text', value: 'also tagged content' }],
        },
      ],
    };
    expect(
      extractTexPart(
        new Session(),
        tree,
        {},
        { id: 'test_tag', as_list: true },
        {},
        { myst: 'v1' },
      ),
    ).toEqual([
      {
        value: 'tagged content',
        imports: [],
        commands: {},
        preamble: '',
      },
      {
        value: 'also tagged content',
        imports: [],
        commands: {},
        preamble: '',
      },
    ]);
  });
  it('part as_list returns list for markdown list', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [
            {
              type: 'list',
              ordered: false,
              spread: false,
              children: [
                {
                  type: 'listItem',
                  spread: true,
                  children: [{ type: 'text', value: 'tagged content' }],
                },
                {
                  type: 'listItem',
                  spread: true,
                  children: [{ type: 'text', value: 'also tagged content' }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(
      extractTexPart(
        new Session(),
        tree,
        {},
        { id: 'test_tag', as_list: true },
        {},
        { myst: 'v1' },
      ),
    ).toEqual([
      {
        value: 'tagged content',
        imports: [],
        commands: {},
        preamble: '',
      },
      {
        value: 'also tagged content',
        imports: [],
        commands: {},
        preamble: '',
      },
    ]);
  });
  it('part as_list returns single item for block with markdown list and other stuff', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'some other stuff' }],
            },
            {
              type: 'list',
              ordered: false,
              spread: false,
              children: [
                {
                  type: 'listItem',
                  spread: true,
                  children: [{ type: 'text', value: 'tagged content' }],
                },
                {
                  type: 'listItem',
                  spread: true,
                  children: [{ type: 'text', value: 'also tagged content' }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(
      extractTexPart(
        new Session(),
        tree,
        {},
        { id: 'test_tag', as_list: true },
        {},
        { myst: 'v1' },
      ),
    ).toEqual([
      {
        value:
          'some other stuff\n\n\\begin{itemize}\n\\item tagged content\n\\item also tagged content\n\\end{itemize}',
        imports: [],
        commands: {},
        preamble: '',
      },
    ]);
  });
  it('part as_list ignores markdown list if there are multiple blocks', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [
            {
              type: 'list',
              ordered: false,
              spread: false,
              children: [
                {
                  type: 'listItem',
                  spread: true,
                  children: [{ type: 'text', value: 'tagged content' }],
                },
                {
                  type: 'listItem',
                  spread: true,
                  children: [{ type: 'text', value: 'also tagged content' }],
                },
              ],
            },
          ],
        },
        {
          type: 'block' as any,
          data: { part: 'test_tag' },
          children: [{ type: 'text', value: 'more tagged content...' }],
        },
      ],
    };
    expect(
      extractTexPart(
        new Session(),
        tree,
        {},
        { id: 'test_tag', as_list: true },
        {},
        { myst: 'v1' },
      ),
    ).toEqual([
      {
        value:
          '\\begin{itemize}\n\\item tagged content\n\\item also tagged content\n\\end{itemize}',
        imports: [],
        commands: {},
        preamble: '',
      },
      {
        value: 'more tagged content...',
        imports: [],
        commands: {},
        preamble: '',
      },
    ]);
  });
});
