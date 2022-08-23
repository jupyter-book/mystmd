import { u } from 'unist-builder';
import type { GenericNode, GenericParent, GenericText, Spec, Token } from './types';
import { withoutTrailingNewline } from './utils';

const UNHIDDEN_TOKENS = new Set([
  'parsed_directive_open',
  'parsed_directive_close',
  'parsed_role_open',
  'parsed_role_close',
]);

function addPositionsToNode(node: GenericNode, token: Token) {
  if (token.map) {
    node.position = {
      start: { line: token.map[0], column: 0 },
      end: { line: token.map[1], column: 0 },
    };
  }
}

/** MarkdownParseState tracks the context of a running token stream.
 *
 * Loosly based on prosemirror-markdown
 */
export class MarkdownParseState {
  stack: GenericNode[];
  handlers: Record<string, TokenHandler>;
  constructor(handlers: Record<string, Spec>) {
    this.stack = [u('root', [] as GenericParent[])];
    this.handlers = getTokenHandlers(handlers);
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  addNode(node?: GenericNode) {
    const top = this.top();
    if (this.stack.length && node && 'children' in top) top.children?.push(node);
    return node;
  }

  addText(text: string, token: Token, type = 'text', attrs?: Record<string, any>) {
    const top = this.top();
    const value = text;
    if (!value || !this.stack.length || !type || !('children' in top)) return;
    const last = top.children?.[top.children.length - 1];
    if (type === 'text' && last?.type === type) {
      // The last node is also text, merge it with a space
      last.value += `${value}`;
      return last;
    }
    const node: GenericText = { type, ...attrs, value };
    top.children?.push(node);
    addPositionsToNode(node, token);
    return node;
  }

  openNode(type: string, token: Token, attrs: Record<string, any>, isLeaf = false) {
    const node: GenericNode = { type, ...attrs };
    addPositionsToNode(node, token);
    if (!isLeaf) (node as GenericParent).children = [];
    this.stack.push(node);
  }

  closeNode() {
    const node = this.stack.pop();
    return this.addNode(node);
  }

  parseTokens(tokens?: Token[] | null) {
    tokens?.forEach((token, index) => {
      if (token.hidden && !UNHIDDEN_TOKENS.has(token.type)) return;
      const handler = this.handlers[token.type];
      if (!handler)
        throw new Error(`Token type ${token.type} not supported by tokensToMyst parser`);
      handler(this, token, tokens, index);
    });
  }
}

type TokenHandler = (
  state: MarkdownParseState,
  token: Token,
  tokens: Token[],
  index: number,
) => void;

function attrs(spec: Spec, token: Token, tokens: Token[], index: number) {
  const attrs = spec.getAttrs?.(token, tokens, index) || spec.attrs || {};
  if ('type' in attrs) throw new Error('You can not have "type" as attrs.');
  if ('children' in attrs) throw new Error('You can not have "children" as attrs.');
  return attrs;
}

function noCloseToken(spec: Spec, type: string) {
  return spec.noCloseToken || type == 'code_inline' || type == 'code_block' || type == 'fence';
}

function getTokenHandlers(specHandlers: Record<string, Spec>) {
  const handlers: Record<string, TokenHandler> = {};

  Object.entries(specHandlers).forEach(([type, spec]) => {
    const nodeType = spec.type;
    if (noCloseToken(spec, type)) {
      handlers[type] = (state, tok, tokens, i) => {
        if (spec.isText) {
          state.addText(
            withoutTrailingNewline(tok.content),
            tok,
            spec.type,
            attrs(spec, tok, tokens, i),
          );
          return;
        }
        state.openNode(nodeType, tok, attrs(spec, tok, tokens, i), spec.isLeaf);
        state.addText(withoutTrailingNewline(tok.content), tok);
        state.closeNode();
      };
    } else {
      handlers[type + '_open'] = (state, tok, tokens, i) =>
        state.openNode(nodeType, tok, attrs(spec, tok, tokens, i));
      handlers[type + '_close'] = (state) => state.closeNode();
    }
  });

  handlers.text = (state, tok) => state.addText(tok.content, tok);
  handlers.inline = (state, tok) => state.parseTokens(tok.children);
  handlers.softbreak = handlers.softbreak || ((state, tok) => state.addText('\n', tok));
  return handlers;
}
