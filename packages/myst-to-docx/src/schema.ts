import type {
  Parent,
  Heading,
  Paragraph,
  Text,
  Emphasis,
  Strong,
  InlineCode,
  Link,
  ThematicBreak,
  Break,
  List,
  ListItem,
  Abbreviation,
  Superscript,
  Subscript,
  Blockquote,
  Code,
  Image,
} from 'myst-spec';
import { AlignmentType, ExternalHyperlink, HeadingLevel, ImageRun, ShadingType } from 'docx';
import type { Handler } from './types';
import { createShortId, getImageWidth } from './utils';
import { createNumbering } from './numbering';
import sizeOf from 'buffer-image-size';

const text: Handler<Text> = (state, node) => {
  state.text(node.value ?? '');
};

const paragraph: Handler<Paragraph> = (state, node) => {
  state.renderContent(node);
  state.closeBlock(node);
};

const heading: Handler<Heading> = (state, node) => {
  state.renderContent(node);
  const headingLevel = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ][node.depth - 1];
  state.closeBlock(node, { heading: headingLevel });
};

const emphasis: Handler<Emphasis> = (state, node) => {
  state.addRunOptions({ italics: true });
  state.renderContent(node);
};

const strong: Handler<Strong> = (state, node) => {
  state.addRunOptions({ bold: true });
  state.renderContent(node);
};

const list: Handler<List> = (state, node) => {
  const style = node.ordered ? 'numbered' : 'bullets';
  if (!state.currentNumbering) {
    const nextId = createShortId();
    state.numbering.push(createNumbering(nextId, style));
    state.currentNumbering = { reference: nextId, level: 0 };
  } else {
    const { reference, level } = state.currentNumbering;
    state.currentNumbering = { reference, level: level + 1 };
  }
  state.renderContent(node);
  if (state.currentNumbering.level === 0) {
    delete state.currentNumbering;
  } else {
    const { reference, level } = state.currentNumbering;
    state.currentNumbering = { reference, level: level - 1 };
  }
};

const listItem: Handler<ListItem> = (state, node) => {
  if (!state.currentNumbering) throw new Error('Trying to create a list item without a list?');
  state.addParagraphOptions({ numbering: state.currentNumbering });
  state.renderContent(node);
};

const link: Handler<Link> = (state, node) => {
  // Pop the stack when we encounter a link
  const stack = state.current;
  state.addRunOptions({ style: 'Hyperlink' });
  state.current = [];
  state.renderContent(node);
  const hyperlink = new ExternalHyperlink({
    link: node.url,
    children: state.current,
  });
  state.current = [...stack, hyperlink];
};

const inlineCode: Handler<InlineCode> = (state, node) => {
  state.text(node.value, {
    font: {
      name: 'Monospace',
    },
    color: '000000',
    shading: {
      type: ShadingType.SOLID,
      color: 'D2D3D2',
      fill: 'D2D3D2',
    },
  });
};

const _break: Handler<Break> = (state) => {
  state.addRunOptions({ break: 1 });
};

const thematicBreak: Handler<ThematicBreak> = (state, node) => {
  // Kinda hacky, but this works to insert two paragraphs, the first with a break
  state.closeBlock(node, { thematicBreak: true });
  state.closeBlock(node);
};

const abbreviation: Handler<Abbreviation> = (state, node) => {
  // TODO: handle abbreviation title
  state.renderContent(node);
};

const subscript: Handler<Subscript> = (state, node) => {
  state.addRunOptions({ subScript: true });
  state.renderContent(node);
};

const superscript: Handler<Superscript> = (state, node) => {
  state.addRunOptions({ superScript: true });
  state.renderContent(node);
};

type Delete = Parent & { type: 'delete' };
type Underline = Parent & { type: 'underline' };
type Smallcaps = Parent & { type: 'smallcaps' };

const _delete: Handler<Delete> = (state, node) => {
  state.addRunOptions({ strike: true });
  state.renderContent(node);
};

const underline: Handler<Underline> = (state, node) => {
  state.addRunOptions({ underline: {} });
  state.renderContent(node);
};

const smallcaps: Handler<Smallcaps> = (state, node) => {
  state.addRunOptions({ smallCaps: true });
  state.renderContent(node);
};

const blockquote: Handler<Blockquote> = (state, node) => {
  state.renderContent(node, { style: 'IntenseQuote' });
};

const code: Handler<Code> = (state, node) => {
  // TODO: render with color etc.
  state.renderContent(node);
  state.closeBlock(node);
};

const image: Handler<Image> = (state, node) => {
  const buffer = state.options.getImageBuffer(node.url);
  const dimensions = sizeOf(buffer);
  const aspect = dimensions.height / dimensions.width;
  const width = getImageWidth(node.width, state.data.maxImageWidth ?? state.options.maxImageWidth);
  state.current.push(
    new ImageRun({
      data: buffer,
      transformation: {
        width,
        height: width * aspect,
      },
    }),
  );
  let alignment: AlignmentType;
  switch (node.align) {
    case 'right':
      alignment = AlignmentType.RIGHT;
      break;
    case 'left':
      alignment = AlignmentType.LEFT;
      break;
    default:
      alignment = AlignmentType.CENTER;
  }
  state.addParagraphOptions({
    alignment,
  });
  state.closeBlock(node);
};

export const defaultHandlers = {
  text,
  paragraph,
  heading,
  emphasis,
  strong,
  inlineCode,
  link,
  break: _break,
  thematicBreak,
  list,
  listItem,
  abbreviation,
  subscript,
  superscript,
  delete: _delete,
  underline,
  smallcaps,
  blockquote,
  code,
  image,

  // // Technical
  // math(state, node) {
  //   state.math(getLatexFromNode(node), { inline: true });
  // },
  // equation(state, node) {
  //   const { id, numbered } = node.attrs;
  //   state.math(getLatexFromNode(node), { inline: false, numbered, id });
  //   state.closeBlock(node);
  // },
  // table(state, node) {
  //   state.table(node);
  // },
};
