import { describe, expect, test } from 'vitest';
import { mystParse } from '../src';

describe('Smartquotes are on by default', () => {
  test('Smart quotes but not replacements', () => {
    const mdast = mystParse(`"foo 'bar' baz" (c)`);
    expect(mdast.children?.[0]?.children?.[0].value).toBe('“foo ‘bar’ baz” (c)');
  });
});
