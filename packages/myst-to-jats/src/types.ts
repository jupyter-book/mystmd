import type { GenericNode, MessageInfo } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { Root } from 'myst-spec';
import type { SourceFileKind } from 'myst-spec-ext';
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

export type MathPlugins = Required<PageFrontmatter>['math'];

export type JatsPart = { part: string | string[]; type?: string; title?: string };

export type Options = {
  handlers?: Record<string, Handler>;
  isNotebookArticleRep?: boolean;
  isSubArticle?: boolean;
  slug?: string;
  extractAbstract?: boolean;
  abstractParts?: JatsPart[];
  backSections?: JatsPart[];
};

export type DocumentOptions = Options & {
  subArticles?: ArticleContent[];
  /**
   * When 'flat', the xml will be on a single line (with exception of CDATA),
   * When `0`, the XML will be on different lines with 0 spaces.
   * When any other value (e.g. `2` or `\t`) the XML will be indented at the start of the line by that amount.
   */
  spaces?: number | 'flat' | '\t';
  writeFullArticle?: boolean;
};

export type StateData = {
  isInContainer?: boolean;
  isNotebookArticleRep?: boolean;
  slug?: string;
  abstracts?: Element[];
  backSections?: Element[];
  acknowledgments?: Element;
};

export type ArticleContent = {
  mdast: Root;
  kind: SourceFileKind;
  frontmatter?: PageFrontmatter;
  citations?: CitationRenderer;
  slug?: string;
};

export interface IJatsSerializer<D extends Record<string, any> = StateData> {
  data: D;
  mdast: Root;
  stack: Element[];
  footnotes: Element[];
  expressions: Element[];
  render: () => IJatsSerializer;
  text: (value?: string) => void;
  renderChildren: (node: any) => void;
  renderInline: (node: GenericNode, name: string, attributes?: Attributes) => void;
  pushNode: (el?: Element) => void;
  addLeaf: (name: string, attributes?: Attributes) => void;
  openNode: (name: string, attributes?: Attributes) => void;
  closeNode: () => void;
  elements: () => Element[];
  warn: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
  error: (message: string, node: GenericNode, source?: string, opts?: MessageInfo) => void;
}
