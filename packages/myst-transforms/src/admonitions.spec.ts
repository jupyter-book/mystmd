import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { admonitionBlockquoteTransform, admonitionHeadersTransform } from './admonitions';
import type { GenericParent } from 'myst-common';

describe('Test admonitionBlockquoteTransform', () => {
  test('blockquote bold admonition', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [
          u('strong', [u('text', 'note')]),
          u('text', 'We know what we are, but know not what we may be.'),
        ]),
      ]),
    ]);
    admonitionBlockquoteTransform(mdast as GenericParent);
    admonitionHeadersTransform(mdast as GenericParent);
    expect(mdast).toEqual(
      u('root', [
        u('admonition', { kind: 'note', class: 'simple' }, [
          u('admonitionTitle', [u('text', 'Note')]),
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        ]),
      ]),
    );
  });
  test('blockquote [!NOTE] admonition', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [u('text', '[!NOTE] We know what we are, but know not what we may be.')]),
      ]),
    ]);
    admonitionBlockquoteTransform(mdast as GenericParent);
    admonitionHeadersTransform(mdast as GenericParent);
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
