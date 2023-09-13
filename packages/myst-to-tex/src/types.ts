import type { References } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { DefinitionDescription, DefinitionTerm, FootnoteDefinition } from 'myst-spec-ext';
import type { VFile } from 'vfile';

export const DEFAULT_IMAGE_WIDTH = 0.7;
export const DEFAULT_PAGE_WIDTH_PIXELS = 800;

export type Handler = (node: any, state: ITexSerializer, parent: any) => void;

export type GlossaryEntry = {
  key: string;
  name: string;
  description: string;
};

export type LatexResult = {
  value: string;
  imports: string[];
  glossary: GlossaryEntry[];
  commands: Record<string, string>;
};

export type MathPlugins = Required<PageFrontmatter>['math'];

export type Options = {
  handlers?: Record<string, Handler>;
  beamer?: boolean;
  math?: MathPlugins;
  bibliography?: 'natbib' | 'biblatex';
  citestyle?: 'numerical-only';
  references?: References;
};

export type StateData = {
  isInTable?: boolean;
  longFigure?: boolean;
  nextCaptionNumbered?: boolean;
  nextHeadingIsFrameTitle?: boolean;
  nextCaptionId?: string;
  mathPlugins: Required<PageFrontmatter>['math'];
  imports: Set<string>;
};

export interface ITexSerializer<D extends Record<string, any> = StateData> {
  file: VFile;
  data: D;
  options: Options;
  references: References;
  footnotes: Record<string, FootnoteDefinition>;
  glossary: Record<string, [DefinitionTerm, DefinitionDescription]>;
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
