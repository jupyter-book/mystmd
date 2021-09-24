import { Node as ProsemirrorNode, Schema, Mark } from 'prosemirror-model';
import {
  Document,
  IParagraphOptions,
  IRunOptions,
  Paragraph,
  SectionType,
  TextRun,
  ExternalHyperlink,
  ParagraphChild,
  MathRun,
  Math,
  TabStopType,
  TabStopPosition,
  SequentialIdentifier,
  Bookmark,
  ImageRun,
  AlignmentType,
} from 'docx';
import sizeOf from 'buffer-image-size';
import { INumbering, createNumbering, NumberingStyles } from './numbering';
import { createShortId } from './utils';

// This is duplicated from @curvenote/schema
export type AlignOptions = 'left' | 'center' | 'right';

export type NodeSerializer<S extends Schema = any> = Record<
  string,
  (
    state: DocxSerializerState<S>,
    node: ProsemirrorNode<S>,
    parent: ProsemirrorNode<S>,
    index: number,
  ) => void
>;

export type MarkSerializer<S extends Schema = any> = Record<
  string,
  (state: DocxSerializerState<S>, node: ProsemirrorNode<S>, mark: Mark<S>) => IRunOptions
>;

export type Options = {
  getImageBuffer: (src: string) => Buffer;
};

export type IMathOpts = {
  inline?: boolean;
  id?: string | null;
  numbered?: boolean;
};

export class DocxSerializerState<S extends Schema = any> {
  nodes: NodeSerializer<S>;

  options: Options;

  marks: MarkSerializer<S>;

  children: Paragraph[];

  numbering: INumbering[];

  nextRunOpts?: IRunOptions;

  current: ParagraphChild[] = [];

  currentLink?: { link: string; children: IRunOptions[] };

  // Optionally add options
  nextParentParagraphOpts?: IParagraphOptions;

  currentNumbering?: { reference: string; level: number };

  constructor(nodes: NodeSerializer<S>, marks: MarkSerializer<S>, options: Options) {
    this.nodes = nodes;
    this.marks = marks;
    this.options = options ?? {};
    this.children = [];
    this.numbering = [];
  }

  renderContent(parent: ProsemirrorNode<S>) {
    parent.forEach((node, _, i) => this.render(node, parent, i));
  }

  render(node: ProsemirrorNode<S>, parent: ProsemirrorNode<S>, index: number) {
    if (typeof parent === 'number') throw new Error('!');
    if (!this.nodes[node.type.name])
      throw new Error(`Token type \`${node.type.name}\` not supported by Word renderer`);
    this.nodes[node.type.name](this, node, parent, index);
  }

  renderMarks(node: ProsemirrorNode<S>, marks: Mark[]): IRunOptions {
    return marks
      .map((mark) => {
        return this.marks[mark.type.name]?.(this, node, mark);
      })
      .reduce((a, b) => ({ ...a, ...b }), {});
  }

  renderInline(parent: ProsemirrorNode<S>) {
    // Pop the stack over to this object when we encounter a link, and closeLink restores it
    let currentLink: { link: string; stack: ParagraphChild[] } | undefined;
    const closeLink = () => {
      if (!currentLink) return;
      const hyperlink = new ExternalHyperlink({
        link: currentLink.link,
        // child: this.current[0],
        children: this.current,
      });
      this.current = [...currentLink.stack, hyperlink];
      currentLink = undefined;
    };
    const openLink = (href: string) => {
      const sameLink = href === currentLink?.link;
      this.addRunOptions({ style: 'Hyperlink' });
      // TODO: https://github.com/dolanmiu/docx/issues/1119
      // Remove the if statement here and oneLink!
      const oneLink = true;
      if (!oneLink) {
        closeLink();
      } else {
        if (currentLink && sameLink) return;
        if (currentLink && !sameLink) {
          // Close previous, and open a new one
          closeLink();
        }
      }
      currentLink = {
        link: href,
        stack: this.current,
      };
      this.current = [];
    };
    const progress = (node: ProsemirrorNode<S>, offset: number, index: number) => {
      const links = node.marks.filter((m) => m.type.name === 'link');
      const hasLink = links.length > 0;
      if (hasLink) {
        openLink(links[0].attrs.href);
      } else if (!hasLink && currentLink) {
        closeLink();
      }
      if (node.isText) {
        this.text(node.text, this.renderMarks(node, node.marks));
      } else {
        this.render(node, parent, index);
      }
    };
    parent.forEach(progress);
    // Must call close at the end of everything, just in case
    closeLink();
  }

  renderList(node: ProsemirrorNode<S>, style: NumberingStyles) {
    if (!this.currentNumbering) {
      const nextId = createShortId();
      this.numbering.push(createNumbering(nextId, style));
      this.currentNumbering = { reference: nextId, level: 0 };
    } else {
      const { reference, level } = this.currentNumbering;
      this.currentNumbering = { reference, level: level + 1 };
    }
    this.renderContent(node);
    if (this.currentNumbering.level === 0) {
      delete this.currentNumbering;
    } else {
      const { reference, level } = this.currentNumbering;
      this.currentNumbering = { reference, level: level - 1 };
    }
  }

  // This is a pass through to the paragraphs, etc. underneath they will close the block
  renderListItem(node: ProsemirrorNode<S>) {
    if (!this.currentNumbering) throw new Error('Trying to create a list item without a list?');
    this.addParagraphOptions({ numbering: this.currentNumbering });
    this.renderContent(node);
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
      new Bookmark({
        id,
        children: [new SequentialIdentifier('Equation')],
      }),
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

  image(src: string, widthPercent = 70, align: AlignOptions = 'center') {
    const buffer = this.options.getImageBuffer(src);
    const dimensions = sizeOf(buffer);
    const aspect = dimensions.height / dimensions.width;
    const maxWidth = 600; // not sure what this actually is, seems to be close for 8.5x11
    const width = maxWidth * (widthPercent / 100);
    this.current.push(
      new ImageRun({
        data: buffer,
        transformation: {
          width,
          height: width * aspect,
        },
      }),
    );
    let alignment: AlignmentType;
    switch (align) {
      case 'right':
        alignment = AlignmentType.RIGHT;
        break;
      case 'left':
        alignment = AlignmentType.LEFT;
        break;
      default:
        alignment = AlignmentType.CENTER;
    }
    this.addParagraphOptions({
      alignment,
    });
  }

  captionLabel(id: string, kind: 'Figure' | 'Table') {
    this.current.push(
      new Bookmark({
        id,
        children: [new TextRun(`${kind} `), new SequentialIdentifier(kind)],
      }),
    );
  }

  closeBlock(node: ProsemirrorNode<S>, props?: IParagraphOptions) {
    const paragraph = new Paragraph({
      children: this.current,
      ...this.nextParentParagraphOpts,
      ...props,
    });
    this.current = [];
    delete this.nextParentParagraphOpts;
    this.children.push(paragraph);
  }
}

export class DocxSerializer<S extends Schema = any> {
  nodes: NodeSerializer<S>;

  marks: MarkSerializer<S>;

  constructor(nodes: NodeSerializer<S>, marks: MarkSerializer<S>) {
    this.nodes = nodes;
    this.marks = marks;
  }

  serialize(content: ProsemirrorNode<S>, options: Options) {
    const state = new DocxSerializerState<S>(this.nodes, this.marks, options);
    state.renderContent(content);
    const doc = new Document({
      numbering: {
        config: state.numbering,
      },
      sections: [
        {
          properties: {
            type: SectionType.CONTINUOUS,
          },
          children: state.children,
        },
      ],
    });
    return doc;
  }
}
