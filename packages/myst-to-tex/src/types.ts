import type { References } from 'myst-common';
import type { PageFrontmatter, MystToTexSettings } from 'myst-frontmatter';
import type { FootnoteDefinition } from 'myst-spec-ext';
import type { VFile } from 'vfile';

export const DEFAULT_IMAGE_WIDTH = 0.7;
export const DEFAULT_PAGE_WIDTH_PIXELS = 800;

export type Handler = (node: any, state: ITexSerializer, parent: any) => void;

export type PreambleData = {
  hasProofs?: boolean;
  printGlossaries?: boolean;
  glossary: Record<string, [string, string]>;
  abbreviations: Record<string, [string, string]>;
};

export type LatexResult = {
  value: string;
  imports: string[];
  preamble: PreambleData;
  commands: Record<string, string>;
};

/**
 * This type has string keys (commands) and object values (name, desc, macro, etc)
 */
export type MathPlugins = Required<PageFrontmatter>['math'];

/**
 * This type only has command/macro strings as key/value pairs
 */
export type SimplifiedMathPlugins = Record<string, string>;

export type Options = MystToTexSettings & {
  handlers?: Record<string, Handler>;
  math?: MathPlugins;
  bibliography?: 'natbib' | 'biblatex';
  printGlossaries?: boolean;
  citestyle?: 'numerical-only';
  references?: References;
};

export type StateData = {
  isInTable?: boolean;
  isInContainer?: boolean;
  longFigure?: boolean;
  nextCaptionNumbered?: boolean;
  nextHeadingIsFrameTitle?: boolean;
  nextCaptionId?: string;
  hasProofs?: boolean;
  mathPlugins: SimplifiedMathPlugins;
  imports: Set<string>;
};

export interface ITexSerializer<D extends Record<string, any> = StateData> {
  file: VFile;
  data: D;
  options: Options;
  references: References;
  footnotes: Record<string, FootnoteDefinition>;
  glossary: Record<string, [string, string]>;
  abbreviations: Record<string, [string, string]>;
  get printGlossary(): boolean;
  usePackages: (...packageNames: string[]) => void;
  write: (value: string) => void;
  text: (value: string, mathMode?: boolean) => void;
  trimEnd: () => void;
  ensureNewLine: (trim?: boolean) => void;
  renderChildren: (node: any, inline?: boolean, delim?: string) => void;
  renderInlineEnvironment: (node: any, env: string, opts?: { after?: string }) => void;
  renderEnvironment: (
    node: any,
    env: string,
    opts?: { parameters?: string; arguments?: string[] },
  ) => void;
  closeBlock: (node: any) => void;
}
