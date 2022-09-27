import type { VFile } from 'vfile';
import type { ITableCellOptions, IParagraphOptions } from 'docx';
import {
  FootnoteReferenceRun,
  TabStopPosition,
  TabStopType,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  ShadingType,
  Math,
  MathRun,
  TableRow,
  Table,
  TableCell,
  Paragraph,
} from 'docx';
import type {
  Parent,
  Heading,
  Paragraph as ParagraphNode,
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
  Block,
  Math as MathNode,
  InlineMath,
  CrossReference,
  Container,
  Caption,
  Table as TableNode,
  TableCell as SpecTableCellNode,
} from 'myst-spec';
import type { Handler, Mutable } from './types';
import {
  createReference,
  createReferenceBookmark,
  createShortId,
  getImageWidth,
  MAX_DOCX_IMAGE_WIDTH,
} from './utils';
import { createNumbering } from './numbering';
import sizeOf from 'buffer-image-size';
import { fileError } from 'myst-common';

const text: Handler<Text> = (state, node) => {
  state.text(node.value ?? '');
};

const paragraph: Handler<ParagraphNode> = (state, node) => {
  state.renderChildren(node);
  state.closeBlock();
};

const block: Handler<Block> = (state, node) => {
  state.renderChildren(node as Parent);
};

const heading: Handler<Heading> = (state, node) => {
  if (!state.options.useFieldsForCrossReferences && node.enumerator) {
    state.text(`${node.enumerator}\t`);
  } else {
    // some way to number the headings?
  }
  state.renderChildren(node);
  const headingLevel = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ][node.depth - 1];
  state.closeBlock({ heading: headingLevel });
};

const emphasis: Handler<Emphasis> = (state, node) => {
  state.addRunOptions({ italics: true });
  state.renderChildren(node);
};

const strong: Handler<Strong> = (state, node) => {
  state.addRunOptions({ bold: true });
  state.renderChildren(node);
};

const list: Handler<List> = (state, node) => {
  const style = node.ordered ? 'numbered' : 'bullets';
  if (!state.data.currentNumbering) {
    const nextId = createShortId();
    state.numbering.push(createNumbering(nextId, style));
    state.data.currentNumbering = { reference: nextId, level: 0 };
  } else {
    const { reference, level } = state.data.currentNumbering;
    state.data.currentNumbering = { reference, level: level + 1 };
  }
  state.renderChildren(node);
  if (state.data.currentNumbering.level === 0) {
    delete state.data.currentNumbering;
  } else {
    const { reference, level } = state.data.currentNumbering;
    state.data.currentNumbering = { reference, level: level - 1 };
  }
};

const listItem: Handler<ListItem> = (state, node, parent) => {
  if (!state.data.currentNumbering) throw new Error('Trying to create a list item without a list?');
  if (state.current.length > 0) {
    // This is a list within a list
    state.closeBlock();
  }
  state.addParagraphOptions({ numbering: state.data.currentNumbering });
  state.renderChildren(node);
  if (parent.type !== 'paragraph') {
    state.closeBlock();
  }
};

const link: Handler<Link> = (state, node) => {
  // Pop the stack when we encounter a link
  const stack = state.current;
  state.addRunOptions({ style: 'Hyperlink' });
  state.current = [];
  state.renderChildren(node);
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

const thematicBreak: Handler<ThematicBreak> = (state) => {
  // Kinda hacky, but this works to insert two paragraphs, the first with a break
  state.closeBlock({ thematicBreak: true });
  state.blankLine();
};

const abbreviation: Handler<Abbreviation> = (state, node) => {
  // TODO: handle abbreviation title
  state.renderChildren(node);
};

const subscript: Handler<Subscript> = (state, node) => {
  state.addRunOptions({ subScript: true });
  state.renderChildren(node);
};

const superscript: Handler<Superscript> = (state, node) => {
  state.addRunOptions({ superScript: true });
  state.renderChildren(node);
};

type Delete = Parent & { type: 'delete' };
type Underline = Parent & { type: 'underline' };
type Smallcaps = Parent & { type: 'smallcaps' };
type DefinitionList = Parent & { type: 'definitionList' };
type DefinitionTerm = Parent & { type: 'definitionTerm' };
type DefinitionDescription = Parent & { type: 'definitionDescription' };
type CaptionNumber = Parent & {
  type: 'captionNumber';
  kind: string;
  label: string;
  identifier: string;
  html_id: string;
  enumerator: string;
};
type FootnoteReference = {
  type: 'footnoteReference';
  identifier: string;
  number?: number;
};
type FootnoteDefinition = Parent & {
  type: 'footnoteReference';
  identifier: string;
  number?: number;
};
type TableCellNode = SpecTableCellNode & { colspan?: number; rowspan?: number; width?: number };

const _delete: Handler<Delete> = (state, node) => {
  state.addRunOptions({ strike: true });
  state.renderChildren(node);
};

const underline: Handler<Underline> = (state, node) => {
  state.addRunOptions({ underline: {} });
  state.renderChildren(node);
};

const smallcaps: Handler<Smallcaps> = (state, node) => {
  state.addRunOptions({ smallCaps: true });
  state.renderChildren(node);
};

const blockquote: Handler<Blockquote> = (state, node) => {
  state.renderChildren(node, { style: 'IntenseQuote' });
};

const code: Handler<Code> = (state, node) => {
  // TODO: render with color etc.
  // put each line in a new paragraph
  node.value.split('\n').forEach((line) => {
    state.text(line, {
      font: {
        name: 'Monospace',
      },
    });
    state.closeBlock();
  });
};

function getAspect(buffer: Buffer, size?: { width: number; height: number }): number {
  if (size) return size.height / size.width;
  try {
    // This does not run client side
    const dimensions = sizeOf(buffer);
    return dimensions.height / dimensions.width;
  } catch (error) {
    return 1;
  }
}

const image: Handler<Image> = (state, node) => {
  const buffer = state.options.getImageBuffer(node.url);
  const dimensions = state.options.getImageDimensions?.(node.url);
  const width = getImageWidth(node.width, state.data.maxImageWidth ?? state.options.maxImageWidth);
  const aspect = getAspect(buffer, dimensions);
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
  state.closeBlock();
};

const definitionStyle: IParagraphOptions = {
  border: {
    left: {
      style: BorderStyle.THICK,
      color: 'D2D3D2',
    },
  },
  indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
};
const definitionList: Handler<DefinitionList> = (state, node) => {
  state.blankLine();
  state.renderChildren(node, definitionStyle);
  state.closeBlock();
  state.blankLine();
};
const definitionTerm: Handler<DefinitionTerm> = (state, node) => {
  state.renderChildren(node, {
    ...definitionStyle,
    shading: {
      type: ShadingType.SOLID,
      color: 'D2D3D2',
      fill: 'D2D3D2',
    },
  });
  state.closeBlock();
};
const definitionDescription: Handler<DefinitionDescription> = (state, node) => {
  state.text('\t');
  state.renderChildren(node, definitionStyle);
  state.closeBlock();
};

const inlineMath: Handler<InlineMath> = (state, node) => {
  const latex = node.value;
  state.current.push(new Math({ children: [new MathRun(latex)] }));
};

const math: Handler<MathNode> = (state, node) => {
  state.blankLine();
  const latex = node.value;
  state.current = [
    new TextRun('\t'),
    new Math({
      children: [new MathRun(latex)],
    }),
  ];
  // Add the number at the end of the field
  if (node.enumerator && node.identifier && state.options.useFieldsForCrossReferences) {
    state.current.push(
      new TextRun('\t('),
      createReferenceBookmark(node.identifier, 'Equation'),
      new TextRun(')'),
    );
  } else if (node.enumerator) {
    state.current.push(new TextRun(`\t(${node.enumerator})`));
  }
  state.closeBlock({
    tabStops: [
      {
        type: TabStopType.CENTER,
        position: TabStopPosition.MAX / 2,
      },
      {
        type: TabStopType.RIGHT,
        position: TabStopPosition.MAX,
      },
    ],
  });
  state.blankLine();
};

const crossReference: Handler<CrossReference> = (state, node) => {
  if (state.options.useFieldsForCrossReferences && node.identifier) {
    state.current.push(createReference(node.identifier));
  } else {
    state.renderChildren(node as Parent);
  }
};

const container: Handler<Container> = (state, node) => {
  state.renderChildren(node);
};

type WordCaptionKind = 'Equation' | 'Figure' | 'Table';

function figCaptionToWordCaption(file: VFile, kind: string): WordCaptionKind {
  switch (kind.toLowerCase()) {
    case 'figure':
      return 'Figure';
    case 'table':
      return 'Table';
    case 'equation':
      return 'Equation';
    case 'code':
      // This is a hack, I don't think word knows about other things!
      return 'Figure';
    default:
      fileError(file, `Unknown figure caption of kind ${kind}`);
      return 'Figure';
  }
}

const captionNumber: Handler<CaptionNumber> = (state, node) => {
  if (state.options.useFieldsForCrossReferences) {
    const bookmarkKind = figCaptionToWordCaption(state.file, node.kind);
    state.current.push(
      createReferenceBookmark(node.identifier, bookmarkKind, `${bookmarkKind} `, ': '),
    );
  } else {
    state.renderChildren(node as Parent, undefined, { bold: true });
    state.text(' ');
  }
};

const caption: Handler<Caption> = (state, node) => {
  state.renderChildren(node, { style: 'Caption' });
};

function getFootnoteNumber(node: FootnoteReference | FootnoteDefinition): number {
  return node.number ?? Number(node.identifier);
}

const footnoteDefinition: Handler<FootnoteDefinition> = (state, node) => {
  const { children, current } = state;
  const number = getFootnoteNumber(node);
  // Delete everything and work with the footnote definition as children
  state.children = [];
  state.current = [];
  state.renderChildren(node as Parent);
  // TODO: a problem here if there are numberings or images
  state.footnotes[number] = { children: state.children as Paragraph[] };
  // Put the children back, and continue
  state.children = children;
  state.current = current;
};
const footnoteReference: Handler<FootnoteReference> = (state, node) => {
  const number = getFootnoteNumber(node);
  state.current.push(new FootnoteReferenceRun(number));
};

const table: Handler<TableNode> = (state, node) => {
  const actualChildren = state.children;
  const rows: TableRow[] = [];
  const imageWidth =
    state.data.maxImageWidth ?? state.options.maxImageWidth ?? MAX_DOCX_IMAGE_WIDTH;
  (node.children as Parent[]).forEach(({ children }) => {
    const rowContent = children as TableCellNode[];
    const cells: TableCell[] = [];
    // Check if all cells are headers in this row
    let tableHeader = true;
    rowContent.forEach((cell) => {
      if (cell.header) {
        tableHeader = false;
      }
    });
    // This scales images inside of tables
    state.data.maxImageWidth = imageWidth / rowContent.length;
    rowContent.forEach((cell) => {
      state.children = [];
      state.renderChildren(cell);
      state.closeBlock();
      const tableCellOpts: Mutable<ITableCellOptions> = { children: state.children };
      const colspan = cell.colspan ?? 1;
      const rowspan = cell.rowspan ?? 1;
      if (colspan > 1) tableCellOpts.columnSpan = colspan;
      if (rowspan > 1) tableCellOpts.rowSpan = rowspan;
      cells.push(new TableCell(tableCellOpts));
    });
    rows.push(new TableRow({ children: cells, tableHeader }));
  });
  state.data.maxImageWidth = imageWidth;
  const tableNode = new Table({ rows });
  actualChildren.push(tableNode);
  // If there are multiple tables, this seperates them
  actualChildren.push(new Paragraph(''));
  state.children = actualChildren;
};

const cite: Handler<{ type: 'cite' } & Parent> = (state, node) => {
  state.renderChildren(node);
};

const citeGroup: Handler<{ type: 'citeGroup'; kind: 'narrative' | 'parenthetical' } & Parent> = (
  state,
  node,
) => {
  if (node.kind === 'narrative') {
    state.renderChildren(node);
  } else {
    state.text('(');
    node.children.forEach((child, ind) => {
      state.render(child);
      if (ind < node.children.length - 1) state.text(';');
    });
    state.text(')');
  }
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
  block,
  definitionList,
  definitionTerm,
  definitionDescription,
  math,
  inlineMath,
  crossReference,
  container,
  caption,
  captionNumber,
  footnoteReference,
  footnoteDefinition,
  table,
  cite,
  citeGroup,
};
