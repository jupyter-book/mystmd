/* eslint-disable import/no-extraneous-dependencies */
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { builders } from 'prosemirror-test-builder';
import { schemas } from '@curvenote/schema';

const schema = new Schema(schemas.presets.full);

export const tnodes = builders(schema, {
  p: { nodeType: 'paragraph' },
  h1: { nodeType: 'heading', level: 1 },
  h2: { nodeType: 'heading', level: 2 },
  hr: { nodeType: 'horizontal_rule' },
  li: { nodeType: 'list_item' },
  ol: { nodeType: 'ordered_list' },
  ol3: { nodeType: 'ordered_list', order: 3 },
  ul: { nodeType: 'bullet_list' },
  pre: { nodeType: 'code_block' },
  br: { nodeType: 'hard_break' },
  img: { nodeType: 'image', src: 'img.png', alt: 'x' },
  a: { markType: 'link', href: 'https://example.com' },
  math: { nodeType: 'math' },
  equation: { nodeType: 'equation', numbered: true, id: 'eq1' },
  equationUnnumbered: { nodeType: 'equation', numbered: false, id: 'eq2' },
  abbr: { nodeType: 'abbr', title: 'Cascading Style Sheets' },
  aside: { nodeType: 'aside' },
});

export const tdoc = (...args: Parameters<typeof tnodes.doc>) => tnodes.doc('', ...args);

export function compare(
  from: (text: string) => ProsemirrorNode,
  to: (doc: ProsemirrorNode) => string,
) {
  function parse(text: string, doc: ProsemirrorNode) {
    expect(from(text).toJSON()).toEqual(doc.toJSON());
  }

  function serialize(doc: ProsemirrorNode, text: string) {
    const ctx = ' oncontextmenu="return false;"';
    expect(to(doc).replace(ctx, '')).toEqual(text);
  }

  function same(text: string | { before: string; after: string }, doc: ProsemirrorNode) {
    const { before, after } = typeof text === 'string' ? { before: text, after: text } : text;
    parse(before, doc);
    serialize(doc, after);
  }
  return same;
}
