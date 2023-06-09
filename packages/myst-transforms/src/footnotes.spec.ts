import { describe, expect, test } from 'vitest';
import type { FootnoteDefinition } from 'myst-spec';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { footnotesTransform, footnotesPlugin } from './footnotes';

describe('Test footnotes plugin', () => {
  test('Enumerates footnote definitions', () => {
    const file = new VFile();
    const def = {
      type: 'footnoteDefinition',
      identifier: 'x',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'test' }] }],
    } as FootnoteDefinition;
    const ref = {
      type: 'footnoteReference',
      identifier: 'x',
    };
    const mdast = { children: [def, ref] } as any;
    footnotesTransform(mdast, file);
    expect(mdast.children[0].number).toEqual(1);
    expect(mdast.children[1].number).toEqual(1);
  });
  test('Test basic pipeline', () => {
    const file = new VFile();
    const def = {
      type: 'footnoteDefinition',
      identifier: 'x',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'test' }] }],
    } as FootnoteDefinition;
    const ref = {
      type: 'footnoteReference',
      identifier: 'x',
    };
    const mdast = { type: 'root', children: [def, ref] } as any;
    unified().use(footnotesPlugin).runSync(mdast, file);
    expect(file.messages.length).toBe(0);
    expect(mdast.children[0].number).toEqual(1);
    expect(mdast.children[1].number).toEqual(1);
  });
  test('Test basic pipeline', () => {
    const file = new VFile();
    const def = {
      type: 'footnoteDefinition',
      identifier: 'x',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'test' }] }],
      number: 10,
    } as FootnoteDefinition;
    const ref = {
      type: 'footnoteReference',
      identifier: 'y',
    };
    const mdast = { type: 'root', children: [def, ref] } as any;
    unified().use(footnotesPlugin).runSync(mdast, file);
    expect(file.messages.length).toBe(1);
    expect(mdast.children[0].number).toEqual(undefined);
    expect(mdast.children[1].number).toEqual(undefined);
  });
});
