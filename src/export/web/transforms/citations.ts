import { CitationRenderer, InlineCite } from 'citation-js-utils';
import { GenericNode, selectAll } from 'mystjs';
import { IDocumentCache } from '../types';
import { Root, References } from './types';

function pushCite(references: References, citeRenderer: CitationRenderer, label: string) {
  if (!references.cite.data[label]) {
    references.cite.order.push(label);
  }
  references.cite.data[label] = {
    // TODO: this number isn't right? Should be the last time it was seen, not the current size.
    number: references.cite.order.length,
    html: citeRenderer[label]?.render(),
  };
}

type CiteKind = 'narrative' | 'parenthetical';

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
  mdast: Root,
  references: References,
  citeRenderer: CitationRenderer,
  cache: IDocumentCache,
) {
  // TODO: this can be simplified if typescript doesn't die on the parent
  selectAll('citeGroup', mdast).forEach((node: GenericNode) => {
    const kind = node.kind as CiteKind;
    node.children?.forEach((cite) => {
      addCitationChildren(cite, citeRenderer, kind);
    });
  });
  selectAll('cite', mdast).forEach((cite: GenericNode) => {
    const citeLabel = cite.label as string;
    // push cites in order of appearance in the document
    pushCite(references, citeRenderer, citeLabel);
    if (hasChildren(cite)) return;
    // These are picked up as they are *not* cite groups
    const success = addCitationChildren(cite, citeRenderer);
    if (!success) cache.session.log.error(`⚠️  Could not find citation: ${cite.label}`);
  });
}
