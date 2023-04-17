import type { Root, Code, CrossReference, TableCell as SpecTableCell } from 'myst-spec';
import type { Cite, FootnoteReference } from 'myst-spec-ext';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { js2xml } from 'xml-js';
import type { CitationRenderer } from 'citation-js-utils';
import type { MessageInfo, GenericNode } from 'myst-common';
import { copyNode, fileError } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { Tags, RefType } from 'jats-xml';
import { getBack } from './backmatter';
import { getArticleMeta, getFront } from './frontmatter';
import type {
  Handler,
  IJatsSerializer,
  Options,
  StateData,
  Element,
  Attributes,
  ArticleContent,
  DocumentOptions,
} from './types';
import { basicTransformations } from './transforms';

type TableCell = SpecTableCell & { colspan?: number; rowspan?: number; width?: number };

function referenceKindToRefType(kind?: string): RefType {
  switch (kind) {
    case 'heading':
      return RefType.sec;
    case 'figure':
      return RefType.fig;
    case 'equation':
      return RefType.dispFormula;
    case 'table':
      return RefType.table;
    default:
      return RefType.custom;
  }
}

function renderLabel(node: GenericNode, state: IJatsSerializer, template = (s: string) => s) {
  const { enumerated, enumerator } = node;
  if (enumerated !== false && enumerator) {
    state.openNode('label');
    state.text(template(enumerator));
    state.closeNode();
  }
}

const handlers: Record<string, Handler> = {
  text(node, state) {
    state.text(node.value);
  },
  paragraph(node, state) {
    state.renderInline(node, 'p');
  },
  section(node, state) {
    state.renderInline(node, 'sec');
  },
  heading(node, state) {
    renderLabel(node, state);
    state.renderInline(node, 'title');
  },
  block(node, state) {
    state.renderChildren(node);
  },
  blockquote(node, state) {
    state.renderInline(node, 'disp-quote');
  },
  definitionList(node, state) {
    state.renderInline(node, 'def-list');
  },
  definitionItem(node, state) {
    state.renderInline(node, 'def-item');
  },
  definitionTerm(node, state) {
    state.renderInline(node, 'term');
  },
  definitionDescription(node, state) {
    state.renderInline(node, 'def');
  },
  code(node, state) {
    const { lang } = node as Code;
    state.renderInline(node, 'code', { language: lang });
  },
  list(node, state) {
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/list.html
    state.renderInline(node, 'list', { 'list-type': node.ordered ? 'ordered' : 'bullet' });
  },
  listItem(node, state) {
    state.renderInline(node, 'list-item');
  },
  thematicBreak() {
    // The use of thematic breaks should be restricted to use inside table cells.
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/hr.html
  },
  inlineMath(node, state) {
    state.openNode('inline-formula');
    state.openNode('tex-math');
    state.addLeaf('cdata', { cdata: node.value });
    state.closeNode();
    state.closeNode();
  },
  math(node, state) {
    state.openNode('disp-formula', { id: node.identifier });
    renderLabel(node, state, (enumerator) => `(${enumerator})`);
    state.openNode('tex-math');
    state.addLeaf('cdata', { cdata: node.value });
    state.closeNode();
    state.closeNode();
  },
  mystRole(node, state) {
    state.renderChildren(node);
  },
  mystDirective(node, state) {
    state.renderChildren(node);
  },
  mystComment() {
    // Do not archive comments
  },
  comment() {
    // Do not archive comments
  },
  strong(node, state) {
    // TODO: potentially add `{ role: 'strong' }`?
    state.renderInline(node, 'bold');
  },
  emphasis(node, state) {
    state.renderInline(node, 'italic');
  },
  underline(node, state) {
    state.renderInline(node, 'underline');
  },
  inlineCode(node, state) {
    state.renderInline(node, 'monospace');
  },
  subscript(node, state) {
    state.renderInline(node, 'sub');
  },
  superscript(node, state) {
    state.renderInline(node, 'sup');
  },
  delete(node, state) {
    state.renderInline(node, 'strike');
  },
  smallcaps(node, state) {
    state.renderInline(node, 'sc');
  },
  break(node, state, parent) {
    if (parent.type === 'paragraph') {
      state.warn('There are no breaks allowed in paragraphs.', node, 'break', {
        url: 'https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/break.html',
      });
      return;
    }
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/break.html
    state.addLeaf('break');
  },
  // abbreviation(node, state) {
  //   // TODO: \newacronym{gcd}{GCD}{Greatest Common Divisor}
  //   // https://www.overleaf.com/learn/latex/glossaries
  //   state.renderChildren(node, true);
  // },
  link(node, state) {
    state.renderInline(node, 'ext-link', { 'ext-link-type': 'uri', 'xlink:href': node.url });
  },
  admonition(node, state) {
    // This is `boxed-text`, the content-type is used to differentiate it
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/boxed-text.html
    state.renderInline(node, 'boxed-text', { 'content-type': node.kind });
  },
  admonitionTitle(node, state) {
    state.openNode('caption');
    state.renderInline(node, 'title');
    state.closeNode();
  },
  attrib(node, state) {
    // This is used inside of disp-quotes
    state.renderInline(node, 'attrib');
  },
  table(node, state) {
    state.renderInline(node, 'table');
  },
  tableHead(node, state) {
    state.renderInline(node, 'thead');
  },
  tableBody(node, state) {
    state.renderInline(node, 'tbody');
  },
  tableFooter(node, state) {
    state.renderInline(node, 'tfoot');
  },
  tableRow(node, state) {
    state.renderInline(node, 'tr');
  },
  tableCell(node, state) {
    const { align, colspan, rowspan } = node as TableCell;
    state.renderInline(node, node.header ? 'th' : 'td', {
      align,
      colspan: colspan ? String(colspan) : undefined,
      rowspan: rowspan ? String(rowspan) : undefined,
    });
  },
  image(node, state) {
    if (node.url?.startsWith('http')) {
      state.warn(`Image URL is remote (${node.url})`, node, 'image');
    }
    if (state.data.isInContainer && node.alt) {
      state.openNode('alt-text');
      state.text(node.alt);
      state.closeNode();
    }
    // TOOD: identifier?
    state.addLeaf('graphic', { 'xlink:href': node.url });
  },
  container(node, state) {
    state.data.isInContainer = true;
    switch (node.kind) {
      case 'figure': {
        state.renderInline(node, 'fig');
        break;
      }
      case 'table': {
        state.renderInline(node, 'table-wrap');
        break;
      }
      case 'quote': {
        // This is transformed in containers.ts
        state.renderChildren(node);
        break;
      }
      case 'code': {
        // This is transformed in containers.ts
        state.renderInline(node, 'boxed-text', { 'content-type': node.kind });
        break;
      }
      default: {
        state.error(`Unhandled container kind of ${node.kind}`, node, 'container');
        state.renderChildren(node);
      }
    }
    delete state.data.isInContainer;
  },
  caption(node, state) {
    state.renderInline(node, 'caption');
  },
  captionNumber(node, state) {
    state.renderInline(node, 'label');
  },
  crossReference(node, state) {
    // Look up reference and add the text
    const { identifier, kind } = node as CrossReference;
    const attrs: Attributes = { 'ref-type': referenceKindToRefType(kind), rid: identifier };
    if (attrs['ref-type'] === RefType.custom && kind) {
      attrs['custom-type'] = kind;
    }
    state.renderInline(node, 'xref', attrs);
  },
  citeGroup(node, state) {
    state.renderChildren(node);
  },
  cite(node, state) {
    const { label } = node as Cite;
    const attrs: Attributes = { 'ref-type': 'bibr', rid: label };
    state.renderInline(node, 'xref', attrs);
  },
  footnoteReference(node, state) {
    const { identifier } = node as FootnoteReference;
    const attrs: Attributes = { 'ref-type': 'fn', rid: identifier };
    state.addLeaf('xref', attrs);
  },
  footnoteDefinition(node, state) {
    state.openNode('fn', { id: node.identifier });
    state.openNode('label');
    state.text(node.label);
    state.closeNode();
    state.renderChildren(node);
    const element = state.stack.pop();
    if (element) state.footnotes.push(element);
  },
  si(node, state) {
    // <named-content content-type="quantity">5 <abbrev content-type="unit" alt="milli meter">mm</abbrev></named-content>
    state.openNode('named-content', { 'content-type': 'quantity' });
    state.text(`${node.number} `);
    state.openNode('abbrev', { 'content-type': 'unit', alt: node.alt });
    state.text(node.unit);
    state.closeNode();
    state.closeNode();
  },
};

function createText(text: string): Element {
  return { type: 'text', text };
}

class JatsSerializer implements IJatsSerializer {
  file: VFile;
  data: StateData;
  handlers: Record<string, Handler>;
  stack: Element[];
  footnotes: Element[];

  constructor(file: VFile, mdast: Root, opts?: Options) {
    this.file = file;
    this.data = {};
    this.stack = [{ type: 'element', elements: [] }];
    this.footnotes = [];
    this.handlers = opts?.handlers ?? handlers;
    const mdastCopy = copyNode(mdast) as any;
    basicTransformations(mdastCopy);
    this.renderChildren(mdastCopy);
    while (this.stack.length > 1) this.closeNode();
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  warn(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `myst-to-jats:${source}` : 'myst-to-jats',
    });
  }

  error(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `myst-to-jats:${source}` : 'myst-to-jats',
    });
  }

  pushNode(el?: Element) {
    const top = this.top();
    if (this.stack.length && el && 'elements' in top) top.elements?.push(el);
    return el;
  }

  text(text?: string) {
    const top = this.top();
    const value = text;
    if (!value || !this.stack.length || !('elements' in top)) return;
    const last = top.elements?.[top.elements.length - 1];
    if (last?.type === 'text') {
      // The last node is also text, merge it
      last.text += `${value}`;
      return last;
    }
    const node = createText(value);
    top.elements?.push(node);
    return node;
  }

  renderChildren(node: GenericNode) {
    node.children?.forEach((child) => {
      const handler = this.handlers[child.type];
      if (handler) {
        handler(child, this, node);
      } else {
        fileError(this.file, `Unhandled JATS conversion for node of "${child.type}"`, {
          node: child,
          source: 'myst-to-jats',
        });
      }
    });
  }

  renderInline(node: GenericNode, name: string, attributes?: Attributes) {
    this.openNode(name, {
      id: name !== 'xref' && node.identifier ? node.identifier : undefined,
      ...attributes,
    });
    if ('children' in node) {
      this.renderChildren(node);
    } else if ('value' in node && node.value) {
      this.text(node.value);
    }
    this.closeNode();
  }

  addLeaf(name: string, attributes?: Attributes) {
    this.openNode(name, attributes, true);
    this.closeNode();
  }

  openNode(name: string, attributes?: Attributes, isLeaf = false) {
    const node: Element =
      name === 'cdata'
        ? { type: 'cdata', cdata: attributes?.cdata }
        : { type: 'element', name, attributes };
    if (!isLeaf) node.elements = [];
    this.stack.push(node);
  }

  closeNode() {
    const node = this.stack.pop();
    return this.pushNode(node);
  }

  elements() {
    return this.stack[0].elements ?? [];
  }
}

export class JatsDocument {
  file: VFile;
  options: DocumentOptions;
  content: ArticleContent;

  constructor(file: VFile, content: ArticleContent, opts?: DocumentOptions) {
    this.file = file;
    this.options = opts ?? {};
    this.content = content;
  }

  article(articleType?: string, specificUse?: string) {
    const attributes: Record<string, string> = {
      'xmlns:mml': 'http://www.w3.org/1998/Math/MathML',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xmlns:ali': 'http://www.niso.org/schemas/ali/1.0/', // Used for the licensing
      'dtd-version': '1.3',
      'xml:lang': 'en',
    };
    if (articleType) attributes['article-type'] = articleType;
    if (specificUse) attributes['specific-use'] = specificUse;
    const state = new JatsSerializer(this.file, this.content.mdast, this.options);
    const elements: Element[] = [
      ...getFront(this.content.frontmatter),
      this.body(state),
      ...getBack(this.content.citations, state.footnotes),
      ...(this.options.subArticles ?? []).map((article) => this.subArticle(article)),
    ];
    const article: Element = {
      type: 'element',
      name: Tags.article,
      attributes,
      elements,
    };
    return article;
  }

  frontStub(frontmatter?: PageFrontmatter): Element[] {
    const stubFrontmatter: Record<string, any> = {};
    if (frontmatter) {
      Object.entries(frontmatter).forEach(([key, val]) => {
        const articleVal = this.content.frontmatter?.[key as keyof PageFrontmatter];
        if (articleVal == null || JSON.stringify(val) !== JSON.stringify(articleVal)) {
          stubFrontmatter[key] = val;
        }
      });
    }
    const articleMeta = getArticleMeta(stubFrontmatter);
    if (!articleMeta) return [];
    return [{ type: 'element', name: 'front-stub', elements: articleMeta.elements }];
  }

  subArticle(content: ArticleContent): Element {
    const state = new JatsSerializer(this.file, content.mdast, this.options);
    const elements: Element[] = [
      ...this.frontStub(content.frontmatter),
      { type: 'element', name: 'body', elements: state.elements() },
      ...getBack(content.citations, state.footnotes),
    ];
    return { type: 'element', name: 'sub-article', elements };
  }

  body(state?: JatsSerializer) {
    if (!state) state = new JatsSerializer(this.file, this.content.mdast, this.options);
    return { type: 'element', name: 'body', elements: state.elements() } as Element;
  }
}

export function writeJats(file: VFile, content: ArticleContent, opts?: DocumentOptions) {
  const doc = new JatsDocument(file, content, opts ?? { handlers });
  const element = opts?.fullArticle ? { type: 'element', elements: [doc.article()] } : doc.body();
  const jats = js2xml(element, {
    compact: false,
    spaces: opts?.spaces,
  });
  file.result = jats;
  return file;
}

const plugin: Plugin<[PageFrontmatter?, CitationRenderer?, DocumentOptions?], Root, VFile> =
  function (frontmatter, citations, opts) {
    this.Compiler = (node, file) => {
      return writeJats(file, { mdast: node as any, frontmatter, citations }, opts);
    };

    return (node: Root) => {
      // Preprocess
      return node;
    };
  };

export default plugin;
