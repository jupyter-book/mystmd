import type { VFile } from 'vfile';
import type { Node, Parent } from 'myst-spec';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { INumberingOptions, IParagraphOptions, IRunOptions, ParagraphChild } from 'docx';
import type { IPropertiesOptions } from 'docx/build/file/core-properties';

export type StateData = {
  maxImageWidth?: number;
};

export type MathPlugins = Required<PageFrontmatter>['math'];

export interface IDocxSerializer<D extends Record<string, any> = StateData> {
  file: VFile;
  data: D;
  options: Options;
  current: ParagraphChild[];
  numbering: INumbering[];
  currentNumbering?: { reference: string; level: number };
  text: (text: string | null | undefined, opts?: IRunOptions) => void;
  renderContent: (
    parent: Parent | Node,
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
   * Handle cross references natively, requires a link step when opening.
   */
  crossReferences?: boolean;
  getImageBuffer: (src: string) => Buffer;
  getImageDimensions?: (src: string) => { width: number; height: number };
  maxImageWidth?: number;
  math?: MathPlugins;
  // localizeId?: (src: string) => string;
  // localizeLink?: (src: string) => string;
  // localizeImageSrc?: (src: string) => string;
};

export type DocxResult = Promise<Blob | Buffer>;

export type Mutable<T> = {
  -readonly [k in keyof T]: T[k];
};

export type IFootnotes = Mutable<Required<IPropertiesOptions>['footnotes']>;
export type INumbering = INumberingOptions['config'][0];
