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
  listType?: string;
  openGroups: string[];
  ignoreNextWhitespace?: boolean;
  maketitle?: boolean;
  appendix?: boolean;
  frontmatter: PageFrontmatter;
};

export interface ITexParser<D extends Record<string, any> = StateData> {
  tex: string;
  raw: GenericNode;
  ast: GenericNode;
  data: D;
  options: Options;
  stack: GenericNode[];
  file: VFile;
  text: (value?: string, escape?: boolean) => void;
  renderChildren: (node: any) => void;
  top: () => GenericNode;
  pushNode: (node?: GenericNode) => void;
  renderBlock: (node: GenericNode, name: string, attributes?: Record<string, any>) => void;
  renderInline: (node: GenericNode, name: string, attributes?: Record<string, any>) => void;
  addLeaf: (name: string, attributes?: Record<string, any>) => void;
  openNode: (name: string, attributes?: Record<string, any>) => void;
  closeNode: () => GenericNode;
  openParagraph: () => void;
  closeParagraph: () => void;
  openBlock: () => void;
  closeBlock: () => void;
  warn: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
  error: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
}
