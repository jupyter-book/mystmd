import { describe, expect, test } from 'vitest';
import { imageInlineTransform } from './images';

describe('Test imageInlineTransform', () => {
  test('image outside paragraph returns self', async () => {
    const mdast = { type: 'root', children: [{ type: 'image', url: 'my-image' }] };
    imageInlineTransform(mdast);
    expect(mdast).toEqual({ type: 'root', children: [{ type: 'image', url: 'my-image' }] });
  });
  test('image inside paragraph adds inline', async () => {
    const mdast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'image', url: 'my-image' }] }],
    };
    imageInlineTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'image', url: 'my-image', inline: true }] },
      ],
    });
  });
});
