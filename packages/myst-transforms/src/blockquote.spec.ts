import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { blockquoteTransform } from './blockquote';

describe('Test blockquoteTransform', () => {
  test('block-quote with attribution inside container preserves container', async (quote) => {
    const mdast = u('root', [
      u('container', { kind: 'quote', class: 'pull-quote' }, [
        u('blockquote', [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          u('paragraph', [u('text', '-- Hamlet'), u('strong', [u('text', 'act 4, Scene 5')])]),
        ]),
      ]),
    ]);
    blockquoteTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u('container', { kind: 'quote', class: 'pull-quote' }, [
          u('blockquote', [
            u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          ]),
          u('caption', [
            u('paragraph', [u('text', 'Hamlet'), u('strong', [u('text', 'act 4, Scene 5')])]),
          ]),
        ]),
      ]),
    );
  });
  test('block-quote without attribution inside container drops container', async (quote) => {
    const mdast = u('root', [
      u('container', { kind: 'quote' }, [
        u('blockquote', [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          u('paragraph', [u('text', 'Hamlet'), u('strong', [u('text', 'act 4, Scene 5')])]),
        ]),
      ]),
    ]);
    blockquoteTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u('blockquote', [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          u('paragraph', [u('text', 'Hamlet'), u('strong', [u('text', 'act 4, Scene 5')])]),
        ]),
      ]),
    );
  });
  test('block-quote without attribution inside container with class preserves container', async (quote) => {
    const mdast = u('root', [
      u('container', { kind: 'quote', class: 'foo' }, [
        u('blockquote', [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          u('paragraph', [u('text', 'Hamlet'), u('strong', [u('text', 'act 4, Scene 5')])]),
        ]),
      ]),
    ]);
    blockquoteTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u('container', { kind: 'quote', class: 'foo' }, [
          u('blockquote', [
            u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
            u('paragraph', [u('text', 'Hamlet'), u('strong', [u('text', 'act 4, Scene 5')])]),
          ]),
        ]),
      ]),
    );
  });
  test('blockquote without attribution is unchanged', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        u('paragraph', [u('text', '(From Hamlet act 4, Scene 5)')]),
      ]),
    ]);
    blockquoteTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u('blockquote', [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          u('paragraph', [u('text', '(From Hamlet act 4, Scene 5)')]),
        ]),
      ]),
    );
  });
  test('blockquote with malformed attribution is unchanged', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        u('paragraph', [u('text', '?? -- Hamlet act 4, Scene 5')]),
      ]),
    ]);
    blockquoteTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u('blockquote', [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          u('paragraph', [u('text', '?? -- Hamlet act 4, Scene 5')]),
        ]),
      ]),
    );
  });
  test.each(['---', '--', '—'])(
    "blockquote with '%s'-format attribution becomes container",
    async (quote) => {
      const mdast = u('root', [
        u('blockquote', [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          u('paragraph', [
            u('text', `${quote} Hamlet`),
            u('strong', [u('text', 'act 4, Scene 5')]),
          ]),
        ]),
      ]);
      blockquoteTransform(mdast);
      expect(mdast).toEqual(
        u('root', [
          u('container', { kind: 'quote' }, [
            u('blockquote', [
              u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
            ]),
            u('caption', [
              u('paragraph', [u('text', `Hamlet`), u('strong', [u('text', 'act 4, Scene 5')])]),
            ]),
          ]),
        ]),
      );
    },
  );
  test.each(['---', '--', '—'])(
    "blockquote with nested '%s'-format attribution becomes container of container",
    async (quote) => {
      const mdast = u('root', [
        u('blockquote', [
          u('blockquote', [
            u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
            u('paragraph', [
              u('text', `${quote} Hamlet`),
              u('strong', [u('text', 'act 4, Scene 5')]),
            ]),
          ]),
          u('paragraph', [
            u('text', `${quote} Hamlet`),
            u('strong', [u('text', 'act 4, Scene 5')]),
          ]),
        ]),
      ]);
      blockquoteTransform(mdast);
      expect(mdast).toEqual(
        u('root', [
          u('container', { kind: 'quote' }, [
            u('blockquote', [
              u('container', { kind: 'quote' }, [
                u('blockquote', [
                  u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
                ]),
                u('caption', [
                  u('paragraph', [u('text', `Hamlet`), u('strong', [u('text', 'act 4, Scene 5')])]),
                ]),
              ]),
            ]),
            u('caption', [
              u('paragraph', [u('text', `Hamlet`), u('strong', [u('text', 'act 4, Scene 5')])]),
            ]),
          ]),
        ]),
      );
    },
  );
  test('blockquote with only-markup attribution loses text node', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        u('paragraph', [u('text', '-- '), u('strong', [u('text', 'Hamlet act 4, Scene 5')])]),
      ]),
    ]);
    blockquoteTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u('container', { kind: 'quote' }, [
          u('blockquote', [
            u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          ]),
          u('caption', [u('paragraph', [u('strong', [u('text', 'Hamlet act 4, Scene 5')])])]),
        ]),
      ]),
    );
  });
  test('blockquote with empty attribution is unchanged', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
        u('paragraph', [u('text', '-- ')]),
      ]),
    ]);
    blockquoteTransform(mdast);
    expect(mdast).toEqual(
      u('root', [
        u('blockquote', [
          u('paragraph', [u('text', 'We know what we are, but know not what we may be.')]),
          u('paragraph', [u('text', '-- ')]),
        ]),
      ]),
    );
  });
});
