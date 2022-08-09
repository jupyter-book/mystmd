import { MyST } from '../src';

describe('linkify', () => {
  it('linkify in paragraph', () => {
    const myst = new MyST();
    const mystLinkify = new MyST({ markdownit: { linkify: true } });
    const content = 'Link in paragraph: example.com';
    expect(myst.parse(content)).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Link in paragraph: example.com' }],
        },
      ],
    });
    expect(mystLinkify.parse(content)).toEqual({
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
    const myst = new MyST();
    const mystLinkify = new MyST({ markdownit: { linkify: true } });
    const content = '# Link in heading: example.com';
    expect(myst.parse(content)).toEqual({
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [{ type: 'text', value: 'Link in heading: example.com' }],
        },
      ],
    });
    expect(mystLinkify.parse(content)).toEqual({
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
    const myst = new MyST();
    const mystLinkify = new MyST({ markdownit: { linkify: true } });
    const content = 'Link in link: [example.com](https://example.com)';
    expect(myst.parse(content)).toEqual({
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
    expect(mystLinkify.parse(content)).toEqual({
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
