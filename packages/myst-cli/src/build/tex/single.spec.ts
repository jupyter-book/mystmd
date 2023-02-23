import type { Root } from 'mdast';
import { Session } from '../../session';
import { extractTexPart } from './single';

describe('extractPart', () => {
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
    const tree: Root = {
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
    const tree: Root = {
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
    });
  });
  it('exceeding max chars passes', async () => {
    const tree: Root = {
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
    });
  });
  it('exceeding max words passes', async () => {
    const tree: Root = {
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
    });
  });
});
