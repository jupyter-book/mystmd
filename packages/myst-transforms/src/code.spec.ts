import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import { codeTransform, inlineCodeFlattenTransform } from './code';

describe('Test codeTransform', () => {
  test('simple code block returns self', async () => {
    const file = new VFile();
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }] };
    codeTransform(mdast, file);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }],
    });
  });
  test('code block lang coerces to python', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast, file);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
  test('code block lang ignores frontmatter', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast, file, { lang: 'javascript' });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
  test('python is not transformed', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast, file, { transformPython: false });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }],
    });
  });
  test('code block lang fills frontmatter', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast, file, { lang: 'javascript' });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'javascript', value: 'y=mx+b' }],
    });
  });
  test('code block lang fills frontmatter and coerces', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast, file, { lang: 'IPython3' });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
  test('code without lang raises warning', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast, file);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', value: 'y=mx+b' }],
    });
    expect(file.messages.length).toBe(1);
  });

  test('inline code with text children will flatten', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'inlineCode',
          children: [
            { type: 'text', value: 'one ' },
            { type: 'text', value: 'two' },
          ],
        },
      ],
    };
    const file = new VFile();
    inlineCodeFlattenTransform(mdast, file);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'inlineCode', value: 'one two' }],
    });
  });

  test('inline code with children and value warns', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'inlineCode',
          value: 'blah',
          children: [{ type: 'text', value: 'x' }],
        },
      ],
    };
    const file = new VFile();
    inlineCodeFlattenTransform(mdast, file);
    expect(mdast).toEqual({
      type: 'root',
      // No changes
      children: [{ type: 'inlineCode', value: 'blah', children: [{ type: 'text', value: 'x' }] }],
    });
    // A warning was created
    expect(file.messages.length).toBe(1);
  });
});
