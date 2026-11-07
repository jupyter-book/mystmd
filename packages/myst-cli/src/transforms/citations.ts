import type { CitationCluster, CitationRenderer, CSL } from 'citation-js-utils';
import {
  cleanBibliographyHtml,
  DEFAULT_CITATION_STYLE,
  getBuiltinCitationStyle,
  renderCitations,
} from 'citation-js-utils';
import { RuleId } from 'myst-common';
import type { GenericNode, GenericParent, References } from 'myst-common';
import { htmlTransform } from 'myst-transforms';
import type { Cite, CiteGroup } from 'myst-spec-ext';
import { visit } from 'unist-util-visit';
import type { ISession } from '../session/types.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';

type CiteCluster = {
  group?: CiteGroup;
  cites: Cite[];
  kind: CitationCluster['kind'];
};

function htmlToPhrasing(html: string): GenericNode[] {
  const tree = { type: 'root', children: [{ type: 'html', value: html }] } as GenericParent;
  htmlTransform(tree);
  const children = tree.children ?? [];
  if (children.length === 1 && children[0].type === 'paragraph') {
    return children[0].children ?? [];
  }
  return children;
}

function hasChildren(node: GenericNode) {
  return node.children && node.children.length > 0;
}

/** Collect citation clusters in document order; a cite outside a citeGroup is its own cluster */
function collectClusters(mdast: GenericParent): CiteCluster[] {
  const clusters: CiteCluster[] = [];
  visit(mdast, (node: GenericNode, _index, parent: GenericParent | null) => {
    if (node.type === 'citeGroup') {
      const cites = (node.children ?? []).filter((child) => child.type === 'cite') as Cite[];
      const kind = (node as CiteGroup).kind ?? 'parenthetical';
      clusters.push({ group: node as CiteGroup, cites, kind });
    } else if (node.type === 'cite' && parent?.type !== 'citeGroup') {
      clusters.push({ cites: [node as Cite], kind: (node as Cite).kind ?? 'parenthetical' });
    }
  });
  return clusters;
}

/**
 * Render citations and the bibliography of one page with a CSL style
 *
 * Each `cite` gets its rendered text as children and each `citeGroup` gets the
 * `open`, `close` and `delimiter` text of the style.
 * `references.cite` gets the bibliography in the order of the style.
 */
export function transformCitations(
  session: ISession,
  file: string,
  mdast: GenericParent,
  renderer: CitationRenderer,
  references: Pick<References, 'cite'>,
  opts?: { style?: string; lang?: string },
) {
  const style = opts?.style ?? (getBuiltinCitationStyle(DEFAULT_CITATION_STYLE) as string);
  const clusters = collectClusters(mdast)
    .map((cluster) => {
      cluster.cites.forEach((cite) => {
        if (renderer[cite.label as string]) {
          delete cite.error;
        } else {
          cite.error = 'not found';
        }
      });
      return { ...cluster, cites: cluster.cites.filter((cite) => !cite.error) };
    })
    .filter(({ cites }) => cites.length > 0);
  if (clusters.length === 0) return;
  const data: Record<string, CSL> = {};
  clusters.forEach(({ cites }) => {
    cites.forEach(({ label }) => {
      data[label as string] = renderer[label as string].cite;
    });
  });
  let rendered: ReturnType<typeof renderCitations>;
  try {
    rendered = renderCitations(
      data,
      clusters.map(({ kind, cites }) => ({
        kind,
        items: cites.map((cite) => ({
          id: cite.label as string,
          prefix: cite.prefix,
          suffix: cite.suffix,
          partial: cite.partial,
        })),
      })),
      style,
      opts?.lang,
    );
  } catch (error) {
    addWarningForFile(
      session,
      file,
      `Citations failed to render: ${(error as Error).message}`,
      'error',
      { ruleId: RuleId.citationRenders },
    );
    clusters.forEach(({ cites }) => {
      cites.forEach((cite) => {
        cite.error = 'rendering error';
      });
    });
    return;
  }
  const enumerators = Object.fromEntries(
    rendered.bibliography.map(({ id }, index) => [id, `${index + 1}`]),
  );
  clusters.forEach(({ group, cites }, index) => {
    const output = rendered.clusters[index];
    const byLabel = Object.fromEntries(cites.map((cite) => [cite.label as string, cite]));
    if (group) {
      const unrendered = group.children.filter((child) => child.type !== 'cite' || child.error);
      group.children = [...output.items.map(({ id }) => byLabel[id]), ...unrendered];
      Object.assign(group, {
        open: output.open,
        close: output.close,
        delimiter: output.delimiter,
      });
    }
    output.items.forEach(({ id, html }) => {
      const cite = byLabel[id];
      cite.enumerator = enumerators[id];
      if (hasChildren(cite)) return;
      const standaloneNarrative = !group && cite.kind === 'narrative';
      cite.children = htmlToPhrasing(standaloneNarrative ? output.html : html) as Cite['children'];
    });
  });
  references.cite = { order: [], data: {} };
  rendered.bibliography.forEach(({ id, html }) => {
    const doi = renderer[id].getDOI();
    references.cite!.order.push(id);
    references.cite!.data[id] = {
      label: id,
      enumerator: enumerators[id],
      doi,
      html: cleanBibliographyHtml(html, doi),
      url: renderer[id].getURL(),
    };
  });
}
