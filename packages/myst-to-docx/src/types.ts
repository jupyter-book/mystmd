import type { VFile } from 'vfile';
import type { Node, Parent } from 'myst-spec';
import type { PageFrontmatter } from 'myst-frontmatter';
import type {
  INumberingOptions,
  IParagraphOptions,
  IRunOptions,
  Paragraph,
  ParagraphChild,
  Table,
} from 'docx';
import type { IPropertiesOptions } from 'docx/build/file/core-properties';

export type StateData = {
  maxImageWidth?: number;
  nextParagraphOpts?: IParagraphOptions;
  nextRunOpts?: IRunOptions;
  currentNumbering?: { reference: string; level: number };
};

export type MathPlugins = Required<PageFrontmatter>['math'];

export interface IDocxSerializer<D extends Record<string, any> = StateData> {
  file: VFile;
  data: D;
  options: Options;
  current: ParagraphChild[];
  children: (Paragraph | Table)[];
  numbering: INumbering[];
  footnotes: IFootnotes;
  text: (text: string | null | undefined, opts?: IRunOptions) => void;
  renderChildren: (
    parent: Parent,
    paragraphOpts?: IParagraphOptions,
    runOpts?: IRunOptions,
  ) => void;
  addParagraphOptions: (opts: IParagraphOptions) => void;
  addRunOptions: (opts: IRunOptions) => void;
  closeBlock: (props?: IParagraphOptions, force?: boolean) => void;
  blankLine: (props?: IParagraphOptions) => void;
}

export type Handler<T extends Node | Parent = any, P extends Node = any> = (
  state: IDocxSerializer,
  node: T,
  parent: P,
) => void;

export type Options = {
  handlers?: Record<string, Handler>;
  /**
   * Handle cross references natively using fields, requires a link step when opening.
   */
  useFieldsForCrossReferences?: boolean;
  getImageBuffer: (src: string) => Buffer;
  getImageDimensions?: (src: string) => { width: number; height: number };
  maxImageWidth?: number;
  math?: MathPlugins;
};

export type DocxResult = Promise<Blob | Buffer>;

export type Mutable<T> = {
  -readonly [k in keyof T]: T[k];
};

export type IFootnotes = Mutable<Required<IPropertiesOptions>['footnotes']>;
export type INumbering = INumberingOptions['config'][0];
