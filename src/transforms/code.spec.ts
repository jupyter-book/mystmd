import { Root } from '../myst';
import { transformCode } from './code';

describe('Test transformCode', () => {
  test('simple code block returns self', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }] };
    transformCode(mdast as Root);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'geometry', value: 'y=mx+b' }],
    });
  });
  test('code block lang coerces to python', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }] };
    transformCode(mdast as Root);
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
  test('code block lang ignores frontmatter', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', lang: 'IPython3', value: 'y=mx+b' }] };
    transformCode(mdast as Root, { kernelspec: { language: 'javascript' } });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
  test('code block lang fills frontmatter', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', value: 'y=mx+b' }] };
    transformCode(mdast as Root, { kernelspec: { language: 'javascript' } });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'javascript', value: 'y=mx+b' }],
    });
  });
  test('code block lang fills frontmatter and coerces', async () => {
    const mdast = { type: 'root', children: [{ type: 'code', value: 'y=mx+b' }] };
    transformCode(mdast as Root, { kernelspec: { language: 'IPython3' } });
    expect(mdast).toEqual({
      type: 'root',
      children: [{ type: 'code', lang: 'python', value: 'y=mx+b' }],
    });
  });
});
