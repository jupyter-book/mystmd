import { describe, expect, test } from 'vitest';
import { htmlTransform, reconstructHtmlTransform } from './html';

describe('Test reconstructHtmlTransform', () => {
  test('tree without html returns self', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }] };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }],
    });
  });
  test('self-contained html returns self', async () => {
    const mdast = { type: 'root', children: [{ type: 'html', value: '<element/>' }] };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'html', value: '<element/>' }],
    });
  });
  test('opening and closing html combine', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'html', value: '<button>' },
        { type: 'html', value: '</button>' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'html', value: '<button></button>' }],
    });
  });
  test('nodes between html open/close become html', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'html', value: '<sup>' },
        { type: 'emphasis', children: [{ type: 'text', value: 'my text' }] },
        { type: 'html', value: '</sup>' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'html', value: '<sup><em>my text</em></sup>' }],
    });
  });
  test('nested html combine', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'html', value: '<button>' },
        { type: 'html', value: '<i>' },
        { type: 'text', value: 'my text' },
        { type: 'html', value: '</i>' },
        { type: 'html', value: '</button>' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'html', value: '<button><i>my text</i></button>' }],
    });
  });
  test('paragraph between html open/close becomes html', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'html', value: '<div>' },
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
        { type: 'html', value: '</div>' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'html', value: '<div><p>my text</p></div>' }],
    });
  });
  test('html comment returns self', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
        { type: 'html', value: '<!-- My Comment -->' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
        { type: 'html', value: '<!-- My Comment -->' },
      ],
    });
  });
  test('standalone html tag returns self', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'html', value: '<button/>' },
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        { type: 'html', value: '<button/>' },
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
      ],
    });
  });
  test('unfinished html tag returns self', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'html', value: '<button>' },
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        { type: 'html', value: '<button>' },
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
      ],
    });
  });
  test('unstarted html tag returns self', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
        { type: 'html', value: '</button>' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
        { type: 'html', value: '</button>' },
      ],
    });
  });
  test('unsafe html is NOT sanitized', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'html', value: '<script>' },
        { type: 'text', value: 'alert("error")' },
        { type: 'html', value: '</script>' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'html', value: '<script>alert("error")</script>' }],
    });
  });
  test('self-closing tags', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'html',
          value: '<a href="https://mystmd.org">',
        },
        {
          type: 'html',
          value: '<img src="https://mystmd.org/logo.png"    />',
        },
        {
          type: 'html',
          value: '<hr>',
        },
        {
          type: 'html',
          value: '<br>',
        },
        { type: 'html', value: '</a>' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'html',
          value:
            '<a href="https://mystmd.org"><img src="https://mystmd.org/logo.png">\n<hr>\n<br></a>',
        },
      ],
    });
  });
  test('figure captions', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'html',
          value: '<figure>',
        },
        {
          type: 'html',
          value: '<img src="img.png" class="big" id="my-img">',
        },
        {
          type: 'html',
          value: '<figcaption>',
        },
        {
          type: 'text',
          value: 'my caption',
        },
        {
          type: 'html',
          value: '</figcaption>',
        },
        {
          type: 'html',
          value: '</figure>',
        },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'html',
          value:
            '<figure><img src="img.png" class="big" id="my-img">\n<figcaption>my caption</figcaption></figure>',
        },
      ],
    });
    htmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'container',
          children: [
            { type: 'image', url: 'img.png', class: 'big', identifier: 'my-img', label: 'my-img' },
            { type: 'caption', children: [{ type: 'text', value: 'my caption' }] },
          ],
        },
      ],
    });
  });
  test('no paragraph when in a paragraph', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See ',
            },
            {
              type: 'html',
              value: '<a href="link.html">',
            },
            {
              type: 'text',
              value: 'here',
            },
            {
              type: 'html',
              value: '</a>',
            },
            {
              type: 'text',
              value: '.',
            },
          ],
        },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See ',
            },
            {
              type: 'html',
              value: '<a href="link.html">here</a>',
            },
            {
              type: 'text',
              value: '.',
            },
          ],
        },
      ],
    });
    htmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See ',
            },
            {
              type: 'link',
              url: 'link.html',
              children: [
                {
                  type: 'text',
                  value: 'here',
                },
              ],
            },
            {
              type: 'text',
              value: '.',
            },
          ],
        },
      ],
    });
  });
  test('no paragraph when in a paragraph', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See ',
            },
            {
              type: 'html',
              value: '<sup>',
            },
            {
              type: 'text',
              value: '[1]',
            },
            {
              type: 'html',
              value: '</sup>',
            },
            {
              type: 'text',
              value: '.',
            },
          ],
        },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See ',
            },
            {
              type: 'html',
              value: '<sup>[1]</sup>',
            },
            {
              type: 'text',
              value: '.',
            },
          ],
        },
      ],
    });
    htmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See ',
            },
            {
              type: 'superscript',
              children: [
                {
                  type: 'text',
                  value: '[1]',
                },
              ],
            },
            {
              type: 'text',
              value: '.',
            },
          ],
        },
      ],
    });
  });
  test('video tags in html', async () => {
    const mdast = {
      type: 'root',
      children: [{ type: 'html', value: '<video loop mute src="test.mp4" />' }],
    };
    htmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'image', url: 'test.mp4' }],
    });
  });
  test('more open tags than close tags', async () => {
    const mdast = {
      type: 'root',
      children: [
        { type: 'html', value: '<table>\n<tr>\n<th>Heading</th>\n</tr>' },
        { type: 'html', value: '<tr>\n<td>data</td>\n</tr>' },
        { type: 'html', value: '</table>' },
      ],
    };
    reconstructHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'html',
          value: '<table>\n<tr>\n<th>Heading</th>\n</tr><tr>\n<td>data</td>\n</tr></table>',
        },
      ],
    });
  });
});
