import { Node as ProsemirrorNode } from 'prosemirror-model';
import { Packer, Document, HeadingLevel, ShadingType } from 'docx';
import { Options, WordSerializer } from './serializer';

function getLatexFromNode(node: ProsemirrorNode): string {
  let math = '';
  node.forEach((child) => {
    if (child.isText) math += child.text;
    // TODO: improve this as we may have other things in the future
  });
  return math;
}

export const wordSerializer = new WordSerializer(
  {
    text(state, node) {
      state.text(node.text ?? '');
    },
    paragraph(state, node) {
      state.renderInline(node);
      state.closeBlock(node);
    },
    heading(state, node) {
      state.renderInline(node);
      const heading = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ][node.attrs.level - 1];
      state.closeBlock(node, { heading });
    },
    blockquote(state, node) {
      // TODO: improve styling?
      state.renderContent(node);
    },
    code_block(state, node) {
      // TODO: something for code
      state.renderContent(node);
    },
    horizontal_rule(state, node) {
      // Kinda hacky, but this works to insert two paragraphs, the first with a break
      state.closeBlock(node, { thematicBreak: true });
      state.closeBlock(node);
    },
    hard_break(state) {
      state.addRunOptions({ break: 1 });
    },
    ordered_list(state, node) {
      state.renderList(node, 'numbered');
    },
    bullet_list(state, node) {
      state.renderList(node, 'bullets');
    },
    list_item(state, node) {
      state.renderListItem(node);
    },
    // Presentational
    image(state, node) {
      const { src } = node.attrs;
      state.image(src);
      state.closeBlock(node);
    },
    // Technical
    math(state, node) {
      state.math(getLatexFromNode(node), { inline: true });
    },
    equation(state, node) {
      const { id, numbered } = node.attrs;
      state.math(getLatexFromNode(node), { inline: false, numbered, id });
      state.closeBlock(node);
    },
  },
  {
    em() {
      return { italics: true };
    },
    strong() {
      return { bold: true };
    },
    link() {
      // Note, this is handled specifically in the serializer
      // Word treats links more like a Node rather than a mark
      return {};
    },
    code() {
      return {
        font: {
          name: 'Monospace',
        },
        color: '000000',
        shading: {
          type: ShadingType.SOLID,
          color: 'D2D3D2',
          fill: 'D2D3D2',
        },
      };
    },
    abbr() {
      // TODO: abbreviation
      return {};
    },
    subscript() {
      return { subScript: true };
    },
    superscript() {
      return { subScript: true };
    },
    strikethrough() {
      // doubleStrike!
      return { strike: true };
    },
    underline() {
      return {
        underline: {},
      };
    },
    smallcaps() {
      return { smallCaps: true };
    },
    allcaps() {
      return { allCaps: true };
    },
  },
);

export function toWord(doc: ProsemirrorNode, opts: Options) {
  return wordSerializer.serialize(doc, opts);
}

export function writeDocx(doc: Document, write: (buffer: Buffer) => void) {
  Packer.toBuffer(doc).then(write);
}
