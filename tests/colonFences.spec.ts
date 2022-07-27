import { MyST } from '../src';

describe('Parses colonFences', () => {
  test('colon fences parse', () => {
    const myst = new MyST();
    const mdast = myst.parse(`:::{tip}\nThis is a tip in a fence!\n:::`);
    expect(mdast.children[0].type).toBe('mystDirective');
    expect((mdast.children[0] as any).name).toBe('tip');
  });
});
