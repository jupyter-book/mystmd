import type { Handler, ITexParser } from './types.js';
import { u } from 'unist-builder';
import { getArguments, replaceTextValue, texToText } from './utils.js';
import type { CiteKind } from 'myst-spec-ext';
import type { GenericNode } from 'myst-common';

function createCitation(
  state: ITexParser,
  node: GenericNode,
  {
    kind,
    partial,
    single,
  }: { kind?: CiteKind; partial?: 'author' | 'year' | 'number'; single?: boolean } = {},
) {
  state.openParagraph();
  const value = texToText(getArguments(node, 'group'));
  const citations = value.split(',').map((l) => l.trim());
  const type: string = single ? 'cite' : 'citeGroup';
  const cite = u(type) as GenericNode;
  if (kind) cite.kind = kind;
  // Stars expand the authors
  if (node.star) cite.expand = true;
  if (partial) cite.partial = partial;
  if (single) {
    cite.label = citations[0];
  } else {
    cite.children = citations.map((label) => u('cite', { kind, label }));
  }
  const args = getArguments(node, 'argument');
  if (args.length > 0) {
    // If there is only one argument, it is the suffix
    const [prefix, suffix] = args.length === 1 ? [undefined, args[0]] : args;
    const prefixText = texToText(prefix).trim();
    const suffixText = texToText(suffix).trim();
    const first = !single && cite.children ? cite.children[0] : cite;
    const last = !single && cite.children ? cite.children[cite.children.length - 1] : cite;
    if (first && prefixText) first.prefix = replaceTextValue(prefixText);
    if (last && suffixText) last.suffix = replaceTextValue(suffixText);
  }
  state.pushNode(cite);
}

const CITATION_HANDLERS: Record<string, Handler> = {
  macro_cite(node, state) {
    createCitation(state, node, { kind: 'narrative' });
  },
  macro_citet(node, state) {
    createCitation(state, node, { kind: 'narrative' });
  },
  macro_citep(node, state) {
    createCitation(state, node, { kind: 'parenthetical' });
  },
  macro_citealp(node, state) {
    createCitation(state, node, { kind: 'parenthetical', single: true });
  },
  macro_citeauthor(node, state) {
    createCitation(state, node, { kind: 'narrative', partial: 'author' });
  },
  macro_citeyear(node, state) {
    createCitation(state, node, { kind: 'narrative', partial: 'year' });
  },
  macro_citeyearpar(node, state) {
    createCitation(state, node, { kind: 'parenthetical', partial: 'year' });
  },
  macro_citenum(node, state) {
    createCitation(state, node, { kind: 'narrative', partial: 'number' });
  },
};

// We will support (but ignore for now!) the uppercase variants
CITATION_HANDLERS.macro_Citet = CITATION_HANDLERS.macro_citet;
CITATION_HANDLERS.macro_Citep = CITATION_HANDLERS.macro_citep;
CITATION_HANDLERS.macro_Citeauthor = CITATION_HANDLERS.macro_citeauthor;

export { CITATION_HANDLERS };
