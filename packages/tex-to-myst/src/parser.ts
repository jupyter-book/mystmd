import type { GenericNode, MessageInfo } from 'myst-common';
import { fileWarn, normalizeLabel, fileError, RuleId } from 'myst-common';
import { u } from 'unist-builder';
import type { VFile } from 'vfile';
import { selectAll } from 'unist-util-select';
import type { PageFrontmatter } from 'myst-frontmatter';
import { BASIC_TEXT_HANDLERS } from './basic.js';
import { TEXT_MARKS_HANDLERS } from './marks.js';
import { CHARACTER_HANDLERS } from './characters.js';
import { CITATION_HANDLERS } from './citations.js';
import { LIST_HANDLERS } from './lists.js';
import { LINK_HANDLERS } from './links.js';
import { REF_HANDLERS } from './refs.js';
import { MATH_HANDLERS } from './math.js';
import { parseLatex } from './tex.js';
import type { Handler, ITexParser, Options, StateData } from './types.js';
import { phrasingTypes, replaceTextValue, UNHANDLED_ERROR_TEXT } from './utils.js';
import { SECTION_HANDLERS } from './sections.js';
import { COLOR_HANDLERS } from './colors.js';
import { FRONTMATTER_HANDLERS } from './frontmatter.js';
import { FIGURE_HANDLERS } from './figures.js';
import { VERBATIM_HANDLERS } from './verbatim.js';
import { MISC_HANDLERS } from './misc.js';
import { TABLE_HANDLERS } from './tables.js';
import { FOOTNOTE_HANDLERS } from './footnotes.js';
import { SIUNITX_HANDLERS } from './siunitx.js';
import { CHEM_HANDLERS } from './chem.js';
import { ALGORITHM_HANDLERS } from './algorithms.js';
import { QUOTE_HANDLERS } from './quotes.js';

const DEFAULT_HANDLERS: Record<string, Handler> = {
  ...BASIC_TEXT_HANDLERS,
  ...FRONTMATTER_HANDLERS,
  ...TEXT_MARKS_HANDLERS,
  ...COLOR_HANDLERS,
  ...REF_HANDLERS,
  ...MATH_HANDLERS,
  ...LIST_HANDLERS,
  ...LINK_HANDLERS,
  ...QUOTE_HANDLERS,
  ...CITATION_HANDLERS,
  ...CHARACTER_HANDLERS,
  ...SECTION_HANDLERS,
  ...FIGURE_HANDLERS,
  ...VERBATIM_HANDLERS,
  ...MISC_HANDLERS,
  ...TABLE_HANDLERS,
  ...FOOTNOTE_HANDLERS,
  ...SIUNITX_HANDLERS,
  ...CHEM_HANDLERS,
  ...ALGORITHM_HANDLERS,
};

// This currently is needed as we don't support affiliations in the frontmatter.
function cleanFrontmatter(frontmatter: PageFrontmatter) {
  frontmatter.authors?.forEach((a) => {
    a.affiliations = a.affiliations?.map((affil) => {
      const update = ((frontmatter as any).affiliations as { id: string; name: string }[])?.find(
        ({ id }) => id === affil,
      );
      return update?.name ?? affil;
    });
  });
}

export class TexParser implements ITexParser {
  tex: string;
  raw: GenericNode;
  ast: GenericNode;
  file: VFile;
  data: StateData;
  options: Options;
  handlers: Record<string, Handler>;
  stack: GenericNode[] = [];
  currentPosition: GenericNode['position'];

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
      theorems: {},
      dynamicHandlers: {},
    };
    this.stack = [{ type: 'root', children: [] }];
    this.handlers = opts?.handlers ?? DEFAULT_HANDLERS;
    this.renderChildren(this.raw);
    this.closeParagraph();
    this.closeBlock();
    let stack: GenericNode;
    do {
      stack = this.closeNode();
    } while (this.stack.length);
    (selectAll('[label]', stack) as GenericNode[]).forEach((node) => {
      const reference = normalizeLabel(node.label);
      if (!reference) return;
      node.identifier = reference.identifier;
      node.label = reference.label;
    });
    cleanFrontmatter(this.data.frontmatter);
    this.ast = stack;
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  warn(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileWarn(this.file, message, {
      ...opts,
      node,
      source: source ? `tex-to-myst:${source}` : 'tex-to-myst',
      ruleId: RuleId.texParses,
    });
  }

  error(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `tex-to-myst:${source}` : 'tex-to-myst',
      ruleId: RuleId.texParses,
    });
  }

  pushNode(el?: GenericNode | GenericNode[]) {
    if (Array.isArray(el)) {
      el.forEach((e) => {
        this.pushNode(e);
      });
      return;
    }
    const top = this.top();
    if (this.stack.length && el && 'children' in top) {
      if (!el.position) el.position = this.currentPosition;
      top.children?.push(el);
    }
  }

  text(text?: string, escape = true) {
    const top = this.top();
    const value = escape ? replaceTextValue(text) : text;
    if (!value || !this.stack.length || !('children' in top)) return;
    const last = top.children?.[top.children.length - 1];
    if (last?.type === 'text') {
      if (last.value && value === ' ') {
        // trim trailing whitespace and replace with a no-break space
        last.value = last.value.replace(/\s+$/, '') + ' ';
        return last;
      }
      // The last node is also text, merge it
      last.value += `${value}`;
      return last;
    }
    const node = u('text', { position: this.currentPosition }, value);
    top.children?.push(node);
    return node;
  }

  renderChildren(node: GenericNode) {
    if (!node) return;
    const children = Array.isArray(node.content) ? node.content : undefined;
    this.currentPosition = node.position ?? this.currentPosition;
    children?.forEach((child) => {
      const kind =
        child.type === 'macro'
          ? `macro_${child.content}`
          : child.type === 'environment'
            ? `env_${child.env}`
            : child.type;
      this.currentPosition = child.position ?? this.currentPosition;
      const handler = this.handlers[kind] ?? this.data.dynamicHandlers[kind];
      if (handler) {
        handler(child, this, node);
      } else {
        this.unhandled.push(kind);
        fileError(this.file, `${UNHANDLED_ERROR_TEXT} for node of "${kind}"`, {
          node: { type: child.type, kind, position: child.position } as GenericNode,
          source: 'tex-to-myst',
          ruleId: RuleId.texParses,
        });
      }
    });
  }

  renderBlock(node: GenericNode, name: string, attributes?: Record<string, any>) {
    this.closeParagraph();
    this.currentPosition = node.position ?? this.currentPosition;
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
      this.currentPosition = node[0]?.position ?? this.currentPosition;
      this.renderChildren({ type: '', content: node });
    } else if ('content' in node) {
      this.currentPosition = node?.position ?? this.currentPosition;
      this.renderChildren(node);
    } else if ('value' in node && node.value) {
      this.currentPosition = node?.position ?? this.currentPosition;
      this.text(node.value);
    }
    this.closeNode();
  }

  addLeaf(name: string, attributes?: Record<string, any>) {
    this.openNode(name, attributes, true);
    this.closeNode();
  }

  openNode(name: string, attributes?: Record<string, any>, isLeaf = false) {
    const node: GenericNode = { type: name, position: this.currentPosition, ...attributes };
    if (!isLeaf) node.children = [];
    this.stack.push(node);
  }

  openParagraph(attributes?: Record<string, any>) {
    const inPhrasing = phrasingTypes.has(this.top()?.type);
    if (inPhrasing) return;
    this.openNode('paragraph', attributes);
  }

  closeParagraph() {
    const top = this.top();
    if (top?.type !== 'paragraph') return;
    const first = top.children?.[0];
    const last = top.children?.slice(-1)?.[0];
    if (first?.type === 'text') {
      first.value = first.value?.replace(/^\s+/, '') ?? '';
    }
    if (last?.type === 'text') {
      last.value = last.value?.replace(/\s+$/, '') ?? '';
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

  openBlock(attributes?: Record<string, any>) {
    this.closeParagraph();
    const inPhrasing = phrasingTypes.has(this.top()?.type);
    if (inPhrasing) return;
    this.openNode('block', attributes);
  }

  closeBlock() {
    this.closeParagraph();
    const top = this.top();
    if (top?.type !== 'block') return;
    if (top.children?.length === 0) {
      // Prune empty blocks
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
