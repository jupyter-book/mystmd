import type { VFile } from 'vfile';
import type { Node, Parent } from 'myst-spec';
import type { IParagraphOptions, IRunOptions, ParagraphChild, ITableCellOptions } from 'docx';
import {
  Paragraph,
  TextRun,
  MathRun,
  Math,
  TabStopType,
  TabStopPosition,
  SequentialIdentifier,
  Bookmark,
  Table,
  TableRow,
  TableCell,
  InternalHyperlink,
  SimpleField,
  FootnoteReferenceRun,
} from 'docx';
import { createShortId } from './utils';
import type {
  Handler,
  IDocxSerializer,
  IFootnotes,
  INumbering,
  Mutable,
  Options,
  StateData,
} from './types';

// This is duplicated from @curvenote/schema
export type AlignOptions = 'left' | 'center' | 'right';

export type IMathOpts = {
  inline?: boolean;
  id?: string | null;
  numbered?: boolean;
};

const MAX_IMAGE_WIDTH = 600;

function createReferenceBookmark(
  id: string,
  kind: 'Equation' | 'Figure' | 'Table',
  before?: string,
  after?: string,
) {
  const textBefore = before ? [new TextRun(before)] : [];
  const textAfter = after ? [new TextRun(after)] : [];
  return new Bookmark({
    id,
    children: [...textBefore, new SequentialIdentifier(kind), ...textAfter],
  });
}

export class DocxSerializer implements IDocxSerializer {
  file: VFile;

  data: StateData;

  handlers: Record<string, Handler>;

  options: Options;

  children: (Paragraph | Table)[];

  numbering: INumbering[];

  footnotes: IFootnotes = {};

  nextRunOpts?: IRunOptions;

  current: ParagraphChild[] = [];

  // Optionally add options
  nextParentParagraphOpts?: IParagraphOptions;

  currentNumbering?: { reference: string; level: number };

  constructor(file: VFile, options: Options) {
    this.file = file;
    this.data = {};
    this.handlers = options.handlers ?? {};
    this.options = options ?? {};
    this.children = [];
    this.numbering = [];
  }

  renderContent(parent: Parent | Node, opts?: IParagraphOptions) {
    if ('children' in parent) {
      parent.children.forEach((node) => {
        if (opts) this.addParagraphOptions(opts);
        this.render(node, parent);
      });
    } else {
      this.render(parent);
    }
  }

  render(node: Node, parent?: Parent) {
    if (!this.handlers[node.type])
      throw new Error(`Token type \`${node.type}\` not supported by docx renderer`);
    this.handlers[node.type](this, node, parent);
  }

  addParagraphOptions(opts: IParagraphOptions) {
    this.nextParentParagraphOpts = { ...this.nextParentParagraphOpts, ...opts };
  }

  addRunOptions(opts: IRunOptions) {
    this.nextRunOpts = { ...this.nextRunOpts, ...opts };
  }

  text(text: string | null | undefined, opts?: IRunOptions) {
    if (!text) return;
    this.current.push(new TextRun({ text, ...this.nextRunOpts, ...opts }));
    delete this.nextRunOpts;
  }

  math(latex: string, opts: IMathOpts = { inline: true }) {
    if (opts.inline || !opts.numbered) {
      this.current.push(new Math({ children: [new MathRun(latex)] }));
      return;
    }
    const id = opts.id ?? createShortId();
    this.current = [
      new TextRun('\t'),
      new Math({
        children: [new MathRun(latex)],
      }),
      new TextRun('\t('),
      createReferenceBookmark(id, 'Equation'),
      new TextRun(')'),
    ];
    this.addParagraphOptions({
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
  }

  table(node: Parent) {
    const actualChildren = this.children;
    const rows: TableRow[] = [];
    const imageWidth = this.data.maxImageWidth ?? this.options.maxImageWidth ?? MAX_IMAGE_WIDTH;
    (node.children as Parent[]).forEach(({ children }) => {
      const rowContent = children as Parent[];
      const cells: TableCell[] = [];
      // Check if all cells are headers in this row
      let tableHeader = true;
      rowContent.forEach((cell) => {
        if (cell.type !== 'table_header') {
          tableHeader = false;
        }
      });
      // This scales images inside of tables
      this.data.maxImageWidth = imageWidth / rowContent.length;
      rowContent.forEach((cell) => {
        this.children = [];
        this.renderContent(cell);
        const tableCellOpts: Mutable<ITableCellOptions> = { children: this.children };
        const colspan = (cell as any).colspan ?? 1;
        const rowspan = (cell as any).rowspan ?? 1;
        if (colspan > 1) tableCellOpts.columnSpan = colspan;
        if (rowspan > 1) tableCellOpts.rowSpan = rowspan;
        cells.push(new TableCell(tableCellOpts));
      });
      rows.push(new TableRow({ children: cells, tableHeader }));
    });
    this.data.maxImageWidth = imageWidth;
    const table = new Table({ rows });
    actualChildren.push(table);
    // If there are multiple tables, this seperates them
    actualChildren.push(new Paragraph(''));
    this.children = actualChildren;
  }

  captionLabel(id: string, kind: 'Figure' | 'Table', { suffix } = { suffix: ': ' }) {
    this.current.push(...[createReferenceBookmark(id, kind, `${kind} `), new TextRun(suffix)]);
  }

  $footnoteCounter = 0;

  footnote(node: Node) {
    const { current, nextRunOpts } = this;
    // Delete everything and work with the footnote inline on the current
    this.current = [];
    delete this.nextRunOpts;
    this.$footnoteCounter += 1;
    this.renderContent(node as Parent);
    this.footnotes[this.$footnoteCounter] = {
      children: [new Paragraph({ children: this.current })],
    };
    this.current = current;
    this.nextRunOpts = nextRunOpts;
    this.current.push(new FootnoteReferenceRun(this.$footnoteCounter));
  }

  closeBlock(node: Node, props?: IParagraphOptions) {
    const paragraph = new Paragraph({
      children: this.current,
      ...this.nextParentParagraphOpts,
      ...props,
    });
    this.current = [];
    delete this.nextParentParagraphOpts;
    this.children.push(paragraph);
  }

  createReference(id: string, before?: string, after?: string) {
    const children: ParagraphChild[] = [];
    if (before) children.push(new TextRun(before));
    children.push(new SimpleField(`REF ${id} \\h`));
    if (after) children.push(new TextRun(after));
    const ref = new InternalHyperlink({ anchor: id, children });
    this.current.push(ref);
  }
}

// export class DocxSerializer {

//   file: VFile;

//   handlers: NodeSerializer;

//   marks: MarkSerializer;

//   constructor(file: VFile, nodes: NodeSerializer, marks: MarkSerializer) {
//     this.file = file;
//     this.nodes = nodes;
//     this.marks = marks;
//   }

//   serialize(content: Node, options: Options) {
//     const state = new DocxSerializerState(this.nodes, this.marks, options);
//     state.renderContent(content);
//     const doc = createDocFromState(state);
//     return doc;
//   }
// }
