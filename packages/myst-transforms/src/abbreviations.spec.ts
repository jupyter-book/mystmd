import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { abbreviationTransform } from './abbreviations';

describe('Test abbreviation replacement', () => {
  test('simple abbreviation replacement', async () => {
    const mdast = u('root', [
      u('blockquote', [
        u('paragraph', [
          u('link', [u('text', 'Link with MyST in it')]),
          u('text', 'This is about MyST Markdown'),
        ]),
      ]),
    ]);
    abbreviationTransform(mdast as any, { abbreviations: { MyST: 'Markedly Structured Text' } });
    expect(mdast).toEqual(
      u('root', [
        u('blockquote', [
          u('paragraph', [
            u('link', [u('text', 'Link with MyST in it')]),
            u('text', 'This is about '),
            u('abbreviation', { title: 'Markedly Structured Text' }, [u('text', 'MyST')]),
            u('text', ' Markdown'),
          ]),
        ]),
      ]),
    );
  });
});
