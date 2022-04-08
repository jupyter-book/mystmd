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

export function transformCitations(
  mdast: Root,
  references: References,
  citeRenderer: CitationRenderer,
  cache: IDocumentCache,
) {
  // TODO: this can be simplified if typescript doesn't die on the parent
  selectAll('citeGroup', mdast).forEach((node: GenericNode) => {
    const { kind } = node;
    node.children?.forEach((cite) => {
      const citeLabel = cite.identifier as string;
      cite.children =
        citeRenderer[citeLabel]?.inline(kind === 'narrative' ? InlineCite.t : InlineCite.p) || [];
    });
  });
  selectAll('cite', mdast).forEach((cite: GenericNode) => {
    const citeLabel = cite.identifier as string;
    // push cites in order of appearance in the document
    pushCite(references, citeRenderer, citeLabel);
    if (cite.children && cite.children.length > 0) return;
    // These are picked up as they are *not* cite groups
    if (citeRenderer[citeLabel]) {
      cite.children = citeRenderer[citeLabel]?.inline(InlineCite.t);
      return;
    }
    cache.session.log.error(`⚠️  Could not find citation: ${citeLabel}`);
    cite.error = true;
  });
}
