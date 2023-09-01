import { describe, expect, test } from 'vitest';
import { reviveHtmlTransform } from './html';

describe('Test reviveHtmlTransform', () => {
  test('tree without html returns self', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }] };
    reviveHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }],
    });
  });
  test('self-contained html returns self', async () => {
    const mdast = { type: 'root', children: [{ type: 'html', value: '<element/>' }] };
    reviveHtmlTransform(mdast);
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
    reviveHtmlTransform(mdast);
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
    reviveHtmlTransform(mdast);
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
    reviveHtmlTransform(mdast);
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
    reviveHtmlTransform(mdast);
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
    reviveHtmlTransform(mdast);
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
    reviveHtmlTransform(mdast);
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
    reviveHtmlTransform(mdast);
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
    reviveHtmlTransform(mdast);
    expect(mdast).toEqual({
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'my text' }] },
        { type: 'html', value: '</button>' },
      ],
    });
  });
});
