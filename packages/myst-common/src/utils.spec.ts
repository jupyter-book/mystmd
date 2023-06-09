import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { mergeTextNodes, toText } from './utils';

describe('Test math trasformations', () => {
  test('toText', () => {
    const para = u('paragraph', [u('text', { value: 'hello ' }), u('strong', { value: 'there' })]);
    expect(toText(para)).toBe('hello there');
  });
  test('mergeTextNodes', () => {
    const x = mergeTextNodes(
      u('root', [
        u('text', { position: { end: 'not' } }, 'hi'),
        u('text', { position: { end: 'yes' } }, 'hum'),
        u('blah'),
        u('text', 'x'),
        u('text', 'y'),
      ]),
    );
    expect(x.children?.length).toBe(3);
    expect(x.children?.[0].value).toBe('hihum');
    expect(x.children?.[0].position?.end).toBe('yes'); // Obviously a real position, but you get the idea
    expect(x.children?.[2].value).toBe('xy');
  });
});
