import type { PageFrontmatter } from 'myst-frontmatter';
import type { FootnoteDefinition } from 'myst-spec-ext';
import type { VFile } from 'vfile';

export const DEFAULT_IMAGE_WIDTH = 0.9;
export const DEFAULT_PAGE_WIDTH_PIXELS = 800;

export type Handler = (node: any, state: ITypstSerializer, parent: any) => void;

export type TypstResult = {
  value: string;
  macros: string[];
  commands: Record<string, string>;
};

export type MathPlugins = Required<PageFrontmatter>['math'];

export type SimplifiedMathPlugins = Record<string, string>;

export type Options = {
  handlers?: Record<string, Handler>;
  math?: MathPlugins;
};

export type StateData = {
  tableColumns?: number;
  isInFigure?: boolean;
  isInBlockquote?: boolean;
  isInTable?: boolean;
  longFigure?: boolean;
  definitionIndent?: number;
  nextCaptionNumbered?: boolean;
  nextHeadingIsFrameTitle?: boolean;
  nextCaptionId?: string;
  mathPlugins: SimplifiedMathPlugins;
  macros: Set<string>;
  list?: {
    env: string[];
  };
};

export type RenderChildrenOptions = { delim?: string; trimEnd?: boolean };

export interface ITypstSerializer<D extends Record<string, any> = StateData> {
  file: VFile;
  data: D;
  options: Options;
  footnotes: Record<string, FootnoteDefinition>;
  useMacro: (macro: string) => void;
  write: (value: string) => void;
  text: (value: string, mathMode?: boolean) => void;
  trimEnd: () => void;
  ensureNewLine: (trim?: boolean) => void;
  addNewLine: () => void;
  renderChildren: (node: any, trailingNewLines?: number, opts?: RenderChildrenOptions) => void;
  renderInlineEnvironment: (node: any, env: string, opts?: { after?: string }) => void;
  renderEnvironment: (
    node: any,
    env: string,
    opts?: { parameters?: string; arguments?: string[] },
  ) => void;
}
