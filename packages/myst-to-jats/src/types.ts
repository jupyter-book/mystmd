import type { PageFrontmatter, ProjectFrontmatter } from 'myst-frontmatter';
import type { GenericNode, MessageInfo } from 'myst-common';
import type { CitationRenderer } from 'citation-js-utils';

export type Attributes = Record<string, string | undefined>;

export type Element = {
  type: 'element' | 'text' | 'cdata';
  name?: string;
  text?: string;
  cdata?: string;
  attributes?: Attributes;
  elements?: Element[];
};

export type Handler = (node: GenericNode, state: IJatsSerializer, parent: any) => void;

export type JatsResult = {
  value: string;
};

export type MathPlugins = Required<PageFrontmatter>['math'];

export type Options = {
  handlers?: Record<string, Handler>;
  spaces?: number;
  fullArticle?: boolean;
  frontmatter?: ProjectFrontmatter;
  bibliography?: CitationRenderer;
};

export type StateData = {
  isInContainer?: boolean;
};

export interface IJatsSerializer<D extends Record<string, any> = StateData> {
  data: D;
  options: Options;
  stack: Element[];
  footnotes: Element[];
  text: (value?: string) => void;
  renderChildren: (node: any) => void;
  renderInline: (node: GenericNode, name: string, attributes?: Attributes) => void;
  addLeaf: (name: string, attributes?: Attributes) => void;
  openNode: (name: string, attributes?: Attributes) => void;
  closeNode: () => void;
  warn: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
  error: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
}
