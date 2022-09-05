import { u } from 'unist-builder';
import type { Root } from 'mdast';
import { blockquoteTransform } from './blockquote';

describe('Test blockquoteTransform', () => {
  test('simple code block returns self', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        u('list', { ordered: false }, [u('listItem', [u('text', 'Hamlet act 4, Scene 5')])]),
      ]),
    ]);
    blockquoteTransform(mdast as Root);
    expect(mdast).toEqual(
      u('root', [
        u('container', { kind: 'quote' }, [
          u('blockquote', [
            u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          ]),
          u('caption', [u('paragraph', [u('text', 'Hamlet act 4, Scene 5')])]),
        ]),
      ]),
    );
  });
});
