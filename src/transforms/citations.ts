import { CitationRenderer, InlineCite } from 'citation-js-utils';
import { GenericNode, selectAll } from 'mystjs';
import { Logger } from '../logging';
import { Root } from '../myst';
import { References } from './types';

export type CiteKind = 'narrative' | 'parenthetical';

export type Cite = {
  type: 'cite';
  kind: CiteKind;
  label: string;
  children: GenericNode['children'];
};

function pushCite(references: References, citeRenderer: CitationRenderer, label: string) {
  if (!references.cite.data[label]) {
    references.cite.order.push(label);
  }
  references.cite.data[label] = {
    // TODO: this number isn't right? Should be the last time it was seen, not the current size.
    number: references.cite.order.length,
    doi: citeRenderer[label]?.getDOI(),
    html: citeRenderer[label]?.render(),
  };
}

function addCitationChildren(
  cite: GenericNode,
  renderer: CitationRenderer,
  kind: CiteKind = 'parenthetical',
): boolean {
  const render = renderer[cite.label as string];
  const children = render?.inline(kind === 'narrative' ? InlineCite.t : InlineCite.p);
  if (children) {
    cite.children = children;
    return true;
  }
  cite.error = true;
  return false;
}

function hasChildren(node: GenericNode) {
  return node.children && node.children.length > 0;
}

export function transformCitations(
  log: Logger,
  mdast: Root,
  renderer: CitationRenderer,
  references: References,
  file: string,
) {
  // TODO: this can be simplified if typescript doesn't die on the parent
  selectAll('citeGroup', mdast).forEach((node: GenericNode) => {
    const kind = node.kind as CiteKind;
    node.children?.forEach((cite) => {
      addCitationChildren(cite, renderer, kind);
    });
  });
  selectAll('cite', mdast).forEach((cite: GenericNode) => {
    const citeLabel = cite.label as string;
    // push cites in order of appearance in the document
    pushCite(references, renderer, citeLabel);
    if (hasChildren(cite)) return;
    // These are picked up as they are *not* cite groups
    const success = addCitationChildren(cite, renderer);
    if (!success) log.error(`⚠️  Could not find citation: ${cite.label} in ${file}`);
  });
}
