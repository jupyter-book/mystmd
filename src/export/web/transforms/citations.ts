import { CitationRenderer, InlineCite } from 'citation-js-utils';
import { GenericNode, selectAll } from 'mystjs';
import { Root, References } from './types';

function pushCite(references: References, citeRenderer: CitationRenderer, label: string) {
  if (!references.cite.data[label]) {
    references.cite.order.push(label);
  }
  references.cite.data[label] = {
    number: references.cite.order.length,
    html: citeRenderer[label]?.render(),
  };
}

export function transformCitations(
  mdast: Root,
  references: References,
  citeRenderer: CitationRenderer,
) {
  selectAll('cite', mdast).forEach((node: GenericNode) => {
    const citeLabel = (node.label ?? '').trim();
    if (!citeLabel) return;
    if (node.kind === 't') {
      pushCite(references, citeRenderer, citeLabel);
      node.label = citeLabel;
      node.children = citeRenderer[citeLabel]?.inline(InlineCite.t) || [];
      return;
    }
    node.children =
      citeLabel?.split(',').map((s: string) => {
        const label = s.trim();
        pushCite(references, citeRenderer, label);
        return {
          type: 'cite',
          label,
          children: citeRenderer[label]?.inline() || [],
        };
      }) ?? [];
    node.type = 'citeGroup';
  });
}
