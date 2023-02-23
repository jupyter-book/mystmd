import type { CitationRenderer } from 'citation-js-utils';
import { InlineCite } from 'citation-js-utils';
import type { Logger } from 'myst-cli-utils';
import type { References } from 'myst-common';
import type { StaticPhrasingContent, Parent } from 'myst-spec';
import type { Cite, CiteKind, CiteGroup } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { Root } from 'mdast';

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

function addCitationChildren(
  cite: Cite,
  renderer: CitationRenderer,
  kind: CiteKind = 'parenthetical',
): boolean {
  const render = renderer[cite.label as string];
  try {
    const children = render?.inline(
      kind === 'narrative' ? InlineCite.t : InlineCite.p,
    ) as StaticPhrasingContent[];
    if (children) {
      cite.children = children;
      return true;
    }
  } catch (error) {
    // pass
  }
  cite.error = true;
  return false;
}

function hasChildren(node: Parent) {
  return node.children && node.children.length > 0;
}

export function transformCitations(
  log: Logger,
  mdast: Root,
  renderer: CitationRenderer,
  references: Pick<References, 'cite'>,
  file: string,
) {
  // TODO: this can be simplified if typescript doesn't die on the parent
  const citeGroups = selectAll('citeGroup', mdast) as CiteGroup[];
  citeGroups.forEach((node) => {
    const kind = node.kind;
    node.children?.forEach((cite) => {
      addCitationChildren(cite, renderer, kind);
    });
  });
  const citations = selectAll('cite', mdast) as Cite[];
  citations.forEach((cite) => {
    const citeLabel = cite.label as string;
    // push cites in order of appearance in the document
    pushCite(references, renderer, citeLabel);
    if (hasChildren(cite)) return;
    // These are picked up as they are *not* cite groups
    const success = addCitationChildren(cite, renderer);
    if (!success) log.error(`⚠️  Could not find citation: ${cite.label} in ${file}`);
  });
}
