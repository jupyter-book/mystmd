import type { VFile } from 'vfile';
import type { Node, Parent } from 'myst-spec';
import { fileError, fileWarn } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { IParagraphOptions, IRunOptions, ParagraphChild, Table } from 'docx';
import { Paragraph, TextRun } from 'docx';
import type { Handler, IDocxSerializer, IFootnotes, INumbering, Options, StateData } from './types';
import { defaultHandlers } from './schema';

// This is duplicated from @curvenote/schema
export type AlignOptions = 'left' | 'center' | 'right';

export type IMathOpts = {
  inline?: boolean;
  id?: string | null;
  numbered?: boolean;
};

export class DocxSerializer implements IDocxSerializer {
  file: VFile;

  data: StateData;

  handlers: Record<string, Handler>;

  options: Options;

  children: (Paragraph | Table)[];

  numbering: INumbering[];

  footnotes: IFootnotes = {};

  current: ParagraphChild[] = [];

  frontmatter: PageFrontmatter = {};

  constructor(file: VFile, options: Options, frontmatter?: PageFrontmatter) {
    this.file = file;
    this.data = {};
    this.handlers = options.handlers ?? defaultHandlers;
    this.options = options ?? {};
    this.children = [];
    this.numbering = [];
    this.frontmatter = frontmatter ?? {};
  }

  render(node: Node, parent?: Parent) {
    if (!this.handlers[node.type]) {
      fileError(this.file, `Node of type "${node.type}" is not supported by docx renderer`, {
        node,
        source: 'myst-to-docx:render',
      });
      return;
    }
    this.handlers[node.type](this, node, parent);
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

  addParagraphOptions(opts: IParagraphOptions) {
    this.data.nextParagraphOpts = { ...this.data?.nextParagraphOpts, ...opts };
  }

  addRunOptions(opts: IRunOptions) {
    this.data.nextRunOpts = { ...this.data.nextRunOpts, ...opts };
  }

  text(text: string | null | undefined, opts?: IRunOptions) {
    if (!text) return;
    this.current.push(new TextRun({ text, ...this.data.nextRunOpts, ...opts }));
    delete this.data.nextRunOpts;
  }

  closeBlock(props?: IParagraphOptions, force = false) {
    if (this.current.length === 0 && !props && !force) {
      delete this.data.nextParagraphOpts;
      return;
    }
    const paragraph = new Paragraph({
      children: this.current,
      ...this.data.nextParagraphOpts,
      ...props,
    });
    this.current = [];
    delete this.data.nextParagraphOpts;
    this.children.push(paragraph);
  }

  blankLine(props?: IParagraphOptions) {
    this.closeBlock(props, true);
  }
}
