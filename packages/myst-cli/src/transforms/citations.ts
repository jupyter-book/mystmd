import type { CitationRenderer } from 'citation-js-utils';
import { InlineCite } from 'citation-js-utils';
import type { GenericNode, GenericParent, References } from 'myst-common';
import type { StaticPhrasingContent } from 'myst-spec';
import type { Cite } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';

function pushCite(
  references: Pick<References, 'cite'>,
  citeRenderer: CitationRenderer,
  label: string,
) {
  if (!references.cite) {
    references.cite = { order: [], data: {} };
  }
  if (!references.cite?.data[label]) {
    references.cite.order.push(label);
  }
  references.cite.data[label] = {
    // TODO: this number isn't right? Should be the last time it was seen, not the current size.
    number: references.cite.order.length,
    doi: citeRenderer[label]?.getDOI(),
    html: citeRenderer[label]?.render(),
  };
}

function addCitationChildren(cite: Cite, renderer: CitationRenderer): boolean {
  const render = renderer[cite.label as string];
  if (!render) {
    cite.error = 'not found';
    return false;
  }
  let children: StaticPhrasingContent[];
  try {
    children = render.inline(cite.kind === 'narrative' ? InlineCite.t : InlineCite.p, {
      prefix: cite.prefix,
      suffix: cite.suffix,
      partial: cite.partial,
    }) as StaticPhrasingContent[];
  } catch (error) {
    cite.error = 'rendering error';
    return false;
  }
  if (!hasChildren(cite)) cite.children = children;
  delete cite.error;
  return true;
}

function hasChildren(node: GenericNode) {
  return node.children && node.children.length > 0;
}

export function transformCitations(
  mdast: GenericParent,
  renderer: CitationRenderer,
  references: Pick<References, 'cite'>,
) {
  const citations = selectAll('cite', mdast) as Cite[];
  citations.forEach((cite) => {
    const citeLabel = cite.label as string;
    // push cites in order of appearance in the document
    const success = addCitationChildren(cite, renderer);
    if (success) pushCite(references, renderer, citeLabel);
  });
}
