import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import type { Root } from 'mdast';
import { admonitionBlockquoteTransform, admonitionHeadersTransform } from './admonitions';

describe('Test admonitionBlockquoteTransform', () => {
  test('simple code block returns self', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [
          u('strong', [u('text', 'note')]),
          u('text', 'We know what we are, but know not what we may be.'),
        ]),
      ]),
    ]);
    admonitionBlockquoteTransform(mdast as Root);
    admonitionHeadersTransform(mdast as Root);
    expect(mdast).toEqual(
      u('root', [
        u('admonition', { kind: 'note', class: 'simple' }, [
          u('admonitionTitle', [u('text', 'Note')]),
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        ]),
      ]),
    );
  });
});
