import type { Root } from 'mdast';
import type { ValidationOptions } from '@curvenote/validators';
import { extractTaggedContent } from './single';

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('extractTaggedContent', () => {
  it('no tagged content returns empty string', async () => {
    expect(
      extractTaggedContent(
        { type: 'root', children: [{ type: 'text', value: 'untagged content' }] },
        { id: 'test_tag' },
        opts,
      ),
    ).toEqual('');
    expect(opts.messages.errors?.length).toBe(undefined);
  });
  it('no tagged content but required errors', async () => {
    expect(
      extractTaggedContent(
        {
          type: 'root',
          children: [
            { type: 'block' as any, children: [{ type: 'text', value: 'untagged content' }] },
          ],
        },
        { id: 'test_tag', required: true },
        opts,
      ),
    ).toEqual('');
    expect(opts.messages.errors?.length).toBe(1);
  });
  it('tagged content removed from tree and returned', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          meta: '{ "tags": ["other_tag"] }',
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'block' as any,
          meta: '{ "tags": ["test_tag"] }',
          children: [{ type: 'text', value: 'tagged content' }],
        },
        {
          type: 'block' as any,
          meta: '{ "tags": ["other_tag", "test_tag"] }',
          children: [{ type: 'text', value: 'also tagged content' }],
        },
      ],
    };
    expect(extractTaggedContent(tree, { id: 'test_tag' }, opts)).toEqual(
      'tagged content\n\nalso tagged content',
    );
    expect(opts.messages.errors?.length).toBe(undefined);
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          meta: '{ "tags": ["other_tag"] }',
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'block' as any,
          meta: '{ "tags": ["test_tag"] }',
          children: [],
        },
        {
          type: 'block' as any,
          meta: '{ "tags": ["other_tag", "test_tag"] }',
          children: [],
        },
      ],
    });
  });
  it('tagged content meeting maximums passes', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          meta: '{ "tags": ["test_tag"] }',
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(
      extractTaggedContent(tree, { id: 'test_tag', max_chars: 1000, max_words: 100 }, opts),
    ).toEqual('tagged content');
    expect(opts.messages.errors?.length).toBe(undefined);
  });
  it('exceeding max chars logs error and returns', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          meta: '{ "tags": ["test_tag"] }',
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(extractTaggedContent(tree, { id: 'test_tag', max_chars: 5 }, opts)).toEqual(
      'tagged content',
    );
    expect(opts.messages.errors?.length).toBe(1);
  });
  it('exceeding max words logs error and returns', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          meta: '{ "tags": ["test_tag"] }',
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(extractTaggedContent(tree, { id: 'test_tag', max_words: 1 }, opts)).toEqual(
      'tagged content',
    );
    expect(opts.messages.errors?.length).toBe(1);
  });
});
