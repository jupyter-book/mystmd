import { describe, expect, test } from 'vitest';
import { mystParse } from '../src';

describe('Parses colonFences', () => {
  test('colon fences parse', () => {
    const mdast = mystParse(
      `:::{tip .dropdown #my-label}\n:class: simple\nThis is a tip in a fence!\n:::`,
    );
    expect(mdast.children[0].type).toBe('mystDirective');
    expect((mdast.children[0] as any).name).toBe('tip');
    expect((mdast as any).children[0].options).toEqual({
      class: 'dropdown simple',
      label: 'my-label',
    });
    expect((mdast as any).children[0].children[0].class).toBe('dropdown simple');
    expect((mdast as any).children[0].children[0].label).toBe('my-label');
    expect((mdast as any).children[0].children[0].identifier).toBe('my-label');
  });
});
