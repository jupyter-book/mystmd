import { describe, expect, it } from 'vitest';
import { visit } from 'unist-util-visit';
import { GenericParent } from 'myst-common';
import { frontmatterPartsTransform } from './parts';
import { Session } from '../session/session';

function stripPositions(tree: GenericParent) {
  visit(tree, (node) => {
    delete node.position;
  });
  return tree;
}

function testMdast() {
  return {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            value: 'hi',
          },
        ],
      },
    ],
  };
}

describe('frontmatterPartsTransform', () => {
  it('frontmatter with no parts passes', async () => {
    const mdast = testMdast();
    const frontmatter = { title: 'No parts' };
    frontmatterPartsTransform(new Session(), 'test.md', mdast, frontmatter);
    expect(mdast).toEqual(testMdast());
    expect(frontmatter).toEqual({ title: 'No parts' });
  });
  it('frontmatter part is moved to mdast', async () => {
    const mdast = testMdast();
    const frontmatter = {
      title: 'Abstract and Statement part',
      parts: { abstract: 'This is my abstract', statement: 'and this is my statement' },
    };
    frontmatterPartsTransform(new Session(), 'test.md', mdast, frontmatter);
    expect(stripPositions(mdast)).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          data: { part: 'abstract' },
          visibility: 'remove',
          children: [
            { type: 'paragraph', children: [{ type: 'text', value: 'This is my abstract' }] },
          ],
        },
        {
          type: 'block',
          data: { part: 'statement' },
          visibility: 'remove',
          children: [
            { type: 'paragraph', children: [{ type: 'text', value: 'and this is my statement' }] },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'hi',
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({
      title: 'Abstract and Statement part',
    });
  });
});
