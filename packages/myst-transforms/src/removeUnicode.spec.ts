import { describe, expect, test } from 'vitest';
import { removeUnicodeTransform } from './removeUnicode';

describe('Remove weird unicode stuff', () => {
  test('Remove unicode', () => {
    const mdast = { type: 'root', children: [{ type: 'text', value: 'xx' }] } as any;
    removeUnicodeTransform(mdast);
    expect(mdast.children[0].value).toBe('xx');
  });
});
