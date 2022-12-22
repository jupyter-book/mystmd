import type { GenericNode, MessageInfo } from 'myst-common';
import { normalizeLabel, fileError } from 'myst-common';
import { u } from 'unist-builder';
import type { VFile } from 'vfile';
import { BASIC_TEXT_HANDLERS } from './basic';
import { TEXT_MARKS_HANDLERS } from './marks';
import { CHARACTER_HANDLERS } from './characters';
import { CITATION_HANDLERS } from './citations';
import { LIST_HANDLERS } from './lists';
import { LINK_HANDLERS } from './links';
import { REF_HANDLERS } from './refs';
import { MATH_HANDLERS } from './math';
import { parseLatex } from './tex';
import type { Handler, ITexParser, Options, StateData } from './types';
import { replaceTextValue, texToText } from './utils';
import { SECTION_HANDLERS } from './sections';
import { COLOR_HANDLERS } from './colors';
import { FRONTMATTER_HANDLERS } from './frontmatter';
import { FIGURE_HANDLERS } from './figures';
import { selectAll } from 'unist-util-select';

const phrasing = new Set([
  'paragraph',
  'heading',
  'strong',
  'emphasis',
  'inlineCode',
  'subscript',
  'superscript',
  'smallcaps',
  'link',
  'span',
]);

const DEFAULT_HANDLERS: Record<string, Handler> = {
  ...BASIC_TEXT_HANDLERS,
  macro_bibliography(node, state) {
    state.closeParagraph();
    // pass, we will auto create a bibliography
    const files = texToText(node)
      .split(',')
      .map((t) => t.trim())
      .filter((t) => !!t);
    state.data.bibliography.push(...files);
  },
  argument(node, state) {
    // often the contents of a group (e.g. caption)
    state.renderChildren(node);
  },
  group(node, state) {
    // often the contents of a group (e.g. caption)
    const prev = state.data.openGroups;
    state.renderChildren(node);
    // We want to backout of the groups and close any open nodes that are terminated by this group
    // For example "{\bf text} not bold"
    state.data.openGroups.reverse().forEach((kind) => {
      const topType = state.top().type;
      if (topType === 'root') return;
      if (topType === kind) {
        state.closeNode();
      } else {
        state.error(
          `Something has probably gone wrong in parsing a group, expecting "${kind}" not "${topType}"`,
          node,
        );
      }
    });
    state.data.openGroups = prev;
  },
  env_document(node, state) {
    state.closeParagraph();
    // let stack: GenericNode;
    // do {
    //   stack = state.closeNode();
    // } while (state.stack.length);
    // console.log(stack);
    // state.stack = [{ type: 'root', children: [] }];
    state.renderChildren(node);
  },
  verbatim(node, state) {
    state.closeParagraph();
    const lines = node.content?.split('\n');
    console.log(lines?.[0]);
    if (lines?.[0].match(/^\[caption\s?=/)) {
      const caption = lines[0].replace(/^\[caption=\s?/, '').replace(/\s?\]$/, '');
      const code = lines.slice(1).join('\n');
      state.pushNode(
        u('container', { kind: 'code' }, [
          u('code', { value: code, lang: 'python' }),
          u('caption', [u('paragraph', [u('text', caption)])]),
        ]),
      );
      return;
    }
    state.pushNode(u('code', { value: node.content }));
  },
  macro_framebox(node, state) {
    state.closeParagraph();
    const last = node.children?.pop();
    if (last) state.renderChildren(last);
  },
  ...FRONTMATTER_HANDLERS,
  ...TEXT_MARKS_HANDLERS,
  ...COLOR_HANDLERS,
  ...REF_HANDLERS,
  ...MATH_HANDLERS,
  ...LIST_HANDLERS,
  ...LINK_HANDLERS,
  ...CITATION_HANDLERS,
  ...CHARACTER_HANDLERS,
  ...SECTION_HANDLERS,
  ...FIGURE_HANDLERS,
};

export class TexParser implements ITexParser {
  tex: string;
  raw: GenericNode;
  ast: GenericNode;
  file: VFile;
  data: StateData;
  options: Options;
  handlers: Record<string, Handler>;
  stack: GenericNode[] = [];

  unhandled: string[] = [];

  constructor(tex: string, file: VFile, opts?: Options) {
    this.tex = tex;
    this.raw = parseLatex(tex);
    this.file = file;
    this.options = opts ?? {};
    this.data = {
      bibliography: [],
      openGroups: [],
      packages: [],
      colors: {},
      macros: {},
      frontmatter: {},
    };
    this.stack = [{ type: 'root', children: [] }];
    this.handlers = opts?.handlers ?? DEFAULT_HANDLERS;
    this.renderChildren(this.raw);
    this.closeParagraph();
    let stack: GenericNode;
    do {
      stack = this.closeNode();
    } while (this.stack.length);
    (selectAll('crossReference,heading,container', stack) as GenericNode[]).forEach((xref) => {
      const label = xref.label;
      const reference = normalizeLabel(label);
      if (!reference) {
        return;
      }
      xref.identifier = reference.identifier;
      xref.label = reference.label;
    });
    this.ast = stack;
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  warn(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `tex-to-myst:${source}` : 'tex-to-myst',
    });
  }

  error(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `tex-to-myst:${source}` : 'tex-to-myst',
    });
  }

  pushNode(el?: GenericNode) {
    const top = this.top();
    if (this.stack.length && el && 'children' in top) top.children?.push(el);
  }

  text(text?: string, escape = true) {
    const top = this.top();
    const value = escape ? replaceTextValue(text) : text;
    if (!value || !this.stack.length || !('children' in top)) return;
    const last = top.children?.[top.children.length - 1];
    if (last?.type === 'text') {
      // The last node is also text, merge it
      last.value += `${value}`;
      return last;
    }
    const node = u('text', value);
    top.children?.push(node);
    return node;
  }

  renderChildren(node: GenericNode) {
    const children = Array.isArray(node.content) ? node.content : undefined;
    children?.forEach((child) => {
      const kind =
        child.type === 'macro'
          ? `macro_${child.content}`
          : child.type === 'environment'
          ? `env_${child.env}`
          : child.type;
      const handler = this.handlers[kind];
      if (handler) {
        handler(child, this, node);
      } else {
        this.unhandled.push(kind);
        fileError(this.file, `Unhandled TEX conversion for node of "${kind}"`, {
          node: { type: child.type, kind, position: child.position } as GenericNode,
          source: 'tex-to-myst',
        });
      }
    });
  }

  renderBlock(node: GenericNode, name: string, attributes?: Record<string, any>) {
    this.closeParagraph();
    this.openNode(name, { ...attributes });
    if ('content' in node) {
      this.renderChildren(node);
    } else if ('value' in node && node.value) {
      this.text(node.value);
    }
    this.closeParagraph();
    this.closeNode();
  }

  renderInline(node: GenericNode | GenericNode[], name: string, attributes?: Record<string, any>) {
    if (!node) return;
    this.openParagraph();
    this.openNode(name, { ...attributes });
    if (Array.isArray(node)) {
      this.renderChildren({ type: '', content: node });
    } else if ('content' in node) {
      this.renderChildren(node);
    } else if ('value' in node && node.value) {
      this.text(node.value);
    }
    this.closeNode();
  }

  addLeaf(name: string, attributes?: Record<string, any>) {
    this.openNode(name, attributes, true);
    this.closeNode();
  }

  openNode(name: string, attributes?: Record<string, any>, isLeaf = false) {
    const node: GenericNode = { type: name, ...attributes };
    if (!isLeaf) node.children = [];
    this.stack.push(node);
  }

  openParagraph() {
    const inPhrasing = phrasing.has(this.top().type);
    if (inPhrasing) return;
    this.openNode('paragraph');
  }

  closeParagraph() {
    const top = this.top();
    if (top?.type !== 'paragraph') return;
    const first = top.children?.slice(0, 1)?.[0];
    const last = top.children?.slice(-1)?.[0];
    if (first?.type === 'text') {
      first.value = first.value?.replace(/^\s/, '') ?? '';
    }
    if (last?.type === 'text') {
      last.value = last.value?.replace(/\s$/, '') ?? '';
    }
    if (
      top.children?.length === 0 ||
      (top.children?.length === 1 && top.children[0].type === 'text' && !top.children[0].value)
    ) {
      // Prune empty paragraphs
      this.stack.pop();
      return;
    }
    this.closeNode();
  }

  closeNode() {
    const node = this.stack.pop();
    this.pushNode(node);
    return node as GenericNode;
  }
}
