import { describe, expect, it } from 'vitest';
import { visit } from 'unist-util-visit';
import { mystParse } from '../src';
import type { GenericParent } from 'myst-common';

function stripPositions(tree: GenericParent) {
  visit(tree, (node) => {
    delete node.position;
  });
  return tree;
}

describe('strikethrough', () => {
  it('strikethrough in paragraph', () => {
    const content = 'A ~~div~~ paragraph!';
    expect(stripPositions(mystParse(content))).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'A ~~div~~ paragraph!' }],
        },
      ],
    });
    expect(stripPositions(mystParse(content, { extensions: { strikethrough: true } }))).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'A ' },
            {
              type: 'delete',
              children: [{ type: 'text', value: 'div' }],
            },
            { type: 'text', value: ' paragraph!' },
          ],
        },
      ],
    });
  });
});
