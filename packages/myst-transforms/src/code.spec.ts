import { describe, expect, test } from 'vitest';
import type { Root } from 'mdast';
import { VFile } from 'vfile';
import { codeTransform } from './code';

describe('Test codeTransform', () => {
  test('simple code block returns self', async () => {
    const file = new VFile();
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }] };
    codeTransform(mdast as Root, file);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }],
    });
  });
  test('code block lang coerces to python', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast as Root, file);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
  test('code block lang ignores frontmatter', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast as Root, file, { lang: 'javascript' });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
  test('python is not transformed', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast as Root, file, { transformPython: false });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }],
    });
  });
  test('code block lang fills frontmatter', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast as Root, file, { lang: 'javascript' });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'javascript', value: 'y=mx+b' }],
    });
  });
  test('code block lang fills frontmatter and coerces', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast as Root, file, { lang: 'IPython3' });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
  test('code without lang raises warning', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', value: 'y=mx+b' }] };
    const file = new VFile();
    codeTransform(mdast as Root, file);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', value: 'y=mx+b' }],
    });
    expect(file.messages.length).toBe(1);
  });
});
