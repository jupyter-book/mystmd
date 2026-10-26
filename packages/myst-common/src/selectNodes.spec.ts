import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { selectMdastNodes } from './selectNodes';

describe('selectMdastNodes', () => {
  test.each(['my-figure', 'nb.ipynb#cell', '1abc', 'a:b', 'say "hi"'])(
    'selects identifier %s',
    (identifier) => {
      const target = u('image', { identifier, url: 'a.png' });
      const tree = u('root', [u('crossReference', { identifier }), target]);
      expect(selectMdastNodes(tree as any, identifier).nodes).toEqual([target]);
    },
  );
});
