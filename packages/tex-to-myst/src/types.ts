import type { VFile } from 'vfile';
import type { GenericNode, MessageInfo } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';

export type Handler = (node: GenericNode, state: ITexParser, parent: any) => void;

export type Options = {
  handlers?: Record<string, Handler>;
};

export type StateData = {
  packages: string[];
  colors: Record<string, string>;
  bibliography: string[];
  macros: Record<string, string>;
  dynamicHandlers: Record<string, Handler>;
  theorems: Record<string, { label?: string; countWith?: string; countAfter?: string }>;
  listType?: string;
  openGroups: string[];
  ignoreNextWhitespace?: boolean;
  maketitle?: boolean;
  appendix?: boolean;
  algorithm_indent?: number;
  frontmatter: PageFrontmatter;
  /** This is called on `\and` in latex, e.g. in the author block */
  andCallback?: () => void;
  lastFootnoteLabel?: string;
  createId?: (partialId?: string) => string;
};

export interface ITexParser<D extends Record<string, any> = StateData> {
  tex: string;
  raw: GenericNode;
  ast: GenericNode;
  data: D;
  options: Options;
  stack: GenericNode[];
  currentPosition: GenericNode['position'];
  file: VFile;
  text: (value?: string, escape?: boolean) => void;
  renderChildren: (node: any) => void;
  top: () => GenericNode;
  pushNode: (node?: GenericNode | GenericNode[]) => void;
  renderBlock: (node: GenericNode, name: string, attributes?: Record<string, any>) => void;
  renderInline: (node: GenericNode, name: string, attributes?: Record<string, any>) => void;
  addLeaf<T = Record<string, any>>(name: string, attributes?: Omit<T, 'type'>): void;
  openNode: (name: string, attributes?: Record<string, any>) => void;
  closeNode: () => GenericNode;
  openParagraph: (attributes?: Record<string, any>) => void;
  closeParagraph: () => void;
  openBlock: (attributes?: Record<string, any>) => void;
  closeBlock: () => void;
  warn: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
  error: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
}
