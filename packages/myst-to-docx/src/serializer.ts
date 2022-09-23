import type { VFile } from 'vfile';
import type { Node, Parent } from 'myst-spec';
import { fileError, fileWarn } from 'myst-common';
import type { IParagraphOptions, IRunOptions, ParagraphChild, ITableCellOptions } from 'docx';
import { Paragraph, TextRun, Table, TableRow, TableCell, FootnoteReferenceRun } from 'docx';
import type {
  Handler,
  IDocxSerializer,
  IFootnotes,
  INumbering,
  Mutable,
  Options,
  StateData,
} from './types';
import { defaultHandlers } from './schema';

// This is duplicated from @curvenote/schema
export type AlignOptions = 'left' | 'center' | 'right';

export type IMathOpts = {
  inline?: boolean;
  id?: string | null;
  numbered?: boolean;
};

const MAX_IMAGE_WIDTH = 600;

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
    this.handlers = options.handlers ?? defaultHandlers;
    this.options = options ?? {};
    this.children = [];
    this.numbering = [];
  }

  renderChildren(parent: Parent, paragraphOpts?: IParagraphOptions, runOpts?: IRunOptions) {
    if (!('children' in parent)) {
      const node = parent as Node;
      fileWarn(this.file, `Excpected children for node of type ${node.type}`, { node });
      return;
    }
    parent.children.forEach((node) => {
      if (paragraphOpts) this.addParagraphOptions(paragraphOpts);
      if (runOpts) this.addRunOptions(runOpts);
      this.render(node, parent);
    });
  }

  render(node: Node, parent?: Parent) {
    if (!this.handlers[node.type]) {
      fileError(this.file, `Node of type "${node.type}" is not supported by docx renderer`);
      return;
    }
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
        this.renderChildren(cell);
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

  $footnoteCounter = 0;

  footnote(node: Node) {
    const { current, nextRunOpts } = this;
    // Delete everything and work with the footnote inline on the current
    this.current = [];
    delete this.nextRunOpts;
    this.$footnoteCounter += 1;
    this.renderChildren(node as Parent);
    this.footnotes[this.$footnoteCounter] = {
      children: [new Paragraph({ children: this.current })],
    };
    this.current = current;
    this.nextRunOpts = nextRunOpts;
    this.current.push(new FootnoteReferenceRun(this.$footnoteCounter));
  }

  closeBlock(props?: IParagraphOptions, force = false) {
    if (this.current.length === 0 && !props && !force) {
      delete this.nextParentParagraphOpts;
      return;
    }
    const paragraph = new Paragraph({
      children: this.current,
      ...this.nextParentParagraphOpts,
      ...props,
    });
    this.current = [];
    delete this.nextParentParagraphOpts;
    this.children.push(paragraph);
  }

  blankLine(props?: IParagraphOptions) {
    this.closeBlock(props, true);
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
