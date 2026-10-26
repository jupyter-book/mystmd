import { describe, expect, it } from 'vitest';
import { mystParse } from '../src';
import { positionFn } from './position';

describe('frontmatter', () => {
  it('positions the frontmatter block by line', () => {
    const content = '---\ntitle: My Title\nsubtitle: My Subtitle\n---\n\nText.\n';
    const tree = mystParse(content);
    expect(tree.children[0]).toMatchObject({
      type: 'code',
      lang: 'yaml',
      position: positionFn(1, 4),
    });
    expect(tree.children[1]).toMatchObject({
      type: 'paragraph',
      position: positionFn(6, 6),
    });
  });
});
