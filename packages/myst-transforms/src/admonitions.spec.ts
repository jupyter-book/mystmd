import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import {
  admonitionBlockquoteTransform,
  admonitionHeadersTransform,
  admonitionQmdTransform,
} from './admonitions';
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
  test('QMD admonitions', async () => {
    const mdast = u('root', [
      u('div', { class: 'callout-tip' }, [
        u('heading', { depth: 1 }, [u('text', 'Tip with Title')]),
        u('paragraph', [u('text', 'This is an example of a callout with a title.')]),
      ]),
    ]);
    admonitionQmdTransform(mdast as GenericParent);
    admonitionHeadersTransform(mdast as GenericParent);
    expect(mdast).toEqual(
      u('root', [
        u('admonition', { kind: 'tip' }, [
          u('admonitionTitle', [u('text', 'Tip with Title')]),
          u('paragraph', [u('text', 'This is an example of a callout with a title.')]),
        ]),
      ]),
    );
  });
});
