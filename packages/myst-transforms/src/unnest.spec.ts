import { unnestTransform } from './unnest';

describe('Test unnesting transformation', () => {
  test('Unnest child from a parent', () => {
    const paragraph = {
      type: 'parent',
      children: [{ type: 'child', value: '' }],
    } as any;
    const mdast = { children: [paragraph] } as any;
    expect(mdast.children[0].type).toBe('parent');
    unnestTransform(mdast, 'parent', 'child');
    expect(mdast.children[0].type).toBe('child');
  });
  test('Unnest child in parent with other content', () => {
    const parent = {
      type: 'parent',
      class: 'importantClass',
      children: [
        { type: 'text', value: 'Hello' },
        { type: 'child', value: '' },
        { type: 'text', value: 'math!' },
      ],
    } as any;
    const mdast = { type: 'root', children: [{ type: 'block', children: [parent] }] } as any;
    expect(mdast.children[0].children[0].type).toBe('parent');
    unnestTransform(mdast, 'parent', 'child');
    expect(mdast.children[0].children[0].type).toBe('parent');
    expect(mdast.children[0].children[0].class).toBe('importantClass');
    expect(mdast.children[0].children[1].type).toBe('child');
    expect(mdast.children[0].children[2].type).toBe('parent');
    expect(mdast.children[0].children[2].class).toBe('importantClass');
  });
});
