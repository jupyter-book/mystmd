import type { PageFrontmatter } from 'myst-frontmatter';
import type { GenericNode, MessageInfo } from 'myst-common';
import type { Jats } from 'jats-xml';
import type { Root } from 'myst-spec';

export type Handler = (node: GenericNode, state: IJatsParser, parent: any) => void;

export type JatsResult = {
  references: any;
  tree: Root;
};

export type MathPlugins = Required<PageFrontmatter>['math'];

export type Options = {
  handlers?: Record<string, Handler>;
};

export type StateData = {
  isInContainer?: boolean;
};

export interface IJatsParser<D extends Record<string, any> = StateData> {
  data: D;
  jats: Jats;
  options: Options;
  stack: GenericNode[];
  text: (value?: string) => void;
  renderChildren: (node: any) => void;
  renderInline: (node: GenericNode, name: string, attributes?: Record<string, any>) => void;
  addLeaf: (name: string, attributes?: Record<string, any>) => void;
  openNode: (name: string, attributes?: Record<string, any>) => void;
  closeNode: () => void;
  warn: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
  error: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
}
