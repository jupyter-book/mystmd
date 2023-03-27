import type { Handler, ITexParser } from './types';
import { u } from 'unist-builder';
import { getArguments, replaceTextValue, texToText } from './utils';
import type { CiteKind } from 'myst-spec-ext';
import type { GenericNode } from 'myst-common';

function createCitation(
  state: ITexParser,
  node: GenericNode,
  kind?: CiteKind,
  partial?: 'author' | 'year' | 'number',
) {
  state.openParagraph();
  const value = texToText(getArguments(node, 'group'));
  const citations = value.split(',').map((l) => l.trim());
  const isGroup = true; // citations.length > 1;
  const type: string = isGroup ? 'citeGroup' : 'cite';
  const cite = u(type) as GenericNode;
  if (kind) cite.kind = kind;
  // Stars expand the authors
  if (node.star) cite.expand = true;
  if (partial) cite.partial = partial;
  if (isGroup) {
    cite.children = citations.map((label) => u('cite', { kind, label }));
  } else {
    cite.label = citations[0];
  }
  const args = getArguments(node, 'argument');
  if (args.length > 0) {
    // If there is only one argument, it is the suffix
    const [prefix, suffix] = args.length === 1 ? [undefined, args[0]] : args;
    const prefixText = texToText(prefix).trim();
    const suffixText = texToText(suffix).trim();
    const first = isGroup && cite.children ? cite.children[0] : cite;
    const last = isGroup && cite.children ? cite.children[cite.children.length - 1] : cite;
    if (first && prefixText) first.prefix = replaceTextValue(prefixText);
    if (last && suffixText) last.suffix = replaceTextValue(suffixText);
  }
  state.pushNode(cite);
}

const CITATION_HANDLERS: Record<string, Handler> = {
  macro_cite(node, state) {
    createCitation(state, node, 'narrative');
  },
  macro_citet(node, state) {
    createCitation(state, node, 'narrative');
  },
  macro_citep(node, state) {
    createCitation(state, node, 'parenthetical');
  },
  macro_citeauthor(node, state) {
    createCitation(state, node, 'narrative', 'author');
  },
  macro_citeyear(node, state) {
    createCitation(state, node, 'narrative', 'year');
  },
  macro_citeyearpar(node, state) {
    createCitation(state, node, 'parenthetical', 'year');
  },
  macro_citenum(node, state) {
    createCitation(state, node, 'narrative', 'number');
  },
};

// We will support (but ignore for now!) the uppercase variants
CITATION_HANDLERS.macro_Citet = CITATION_HANDLERS.macro_citet;
CITATION_HANDLERS.macro_Citep = CITATION_HANDLERS.macro_citep;
CITATION_HANDLERS.macro_Citeauthor = CITATION_HANDLERS.macro_citeauthor;

export { CITATION_HANDLERS };
