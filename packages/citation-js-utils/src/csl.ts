import CSLEngine from 'citeproc';
import { plugins } from '@citation-js/core';
import { locales } from '@citation-js/plugin-csl/lib/locales.js';
import '@citation-js/plugin-csl';
import type { CSL } from './index.js';

export const DEFAULT_CITATION_STYLE = 'apa';

const NO_PRINTED_FORM = '[NO_PRINTED_FORM]';

export type CitationClusterItem = {
  id: string;
  prefix?: string;
  suffix?: string;
  partial?: 'author' | 'year';
};

export type CitationCluster = {
  kind: 'narrative' | 'parenthetical';
  items: CitationClusterItem[];
};

export type RenderedCitationCluster = {
  /** HTML of the complete cluster, including the opening and closing text */
  html: string;
  /** HTML of each item without the cluster opening and closing text, in output order */
  items: { id: string; html: string }[];
  open: string;
  close: string;
  delimiter: string;
};

export type RenderedCitations = {
  clusters: RenderedCitationCluster[];
  /** Bibliography entries in the order the style specifies */
  bibliography: { id: string; html: string }[];
};

/**
 * Return the XML of a style that citation-js includes (`apa`, `vancouver`, `harvard1`)
 */
export function getBuiltinCitationStyle(name: string): string | undefined {
  const templates = plugins.config.get('@csl').templates;
  return templates.has(name) ? templates.get(name) : undefined;
}

/**
 * Return the URL of the parent style if `xml` is a dependent CSL style
 */
export function getParentStyleUrl(xml: string): string | undefined {
  if (!/<citation[\s>]/.test(xml)) {
    return xml.match(/<link[^>]*rel="independent-parent"[^>]*>/)?.[0].match(/href="([^"]+)"/)?.[1];
  }
  return undefined;
}

function retrieveLocale(lang: string) {
  return locales.get(lang) ?? locales.get(lang.replace('-', '_')) ?? locales.get('en-US');
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Author names for numeric styles, which have no printed author form in citations */
function authorHtml(data: CSL): string {
  const names = (data.author?.length ? data.author : data.editor) as CSL['author'];
  if (!names || names.length === 0) return escapeHtml(data.publisher || data.title || data.id);
  const name = (n: NonNullable<CSL['author']>[0]) => escapeHtml(n.family ?? n.literal ?? '');
  if (names.length === 1) return name(names[0]);
  if (names.length === 2) return `${name(names[0])} &amp; ${name(names[1])}`;
  return `${name(names[0])} <i>et al.</i>`;
}

function stripAffixes(html: string, open: string, close: string) {
  let out = html.trim();
  if (open && out.startsWith(open)) out = out.slice(open.length);
  if (close && out.endsWith(close)) out = out.slice(0, -close.length);
  return out.trim();
}

function toCiteprocItem(item: CitationClusterItem) {
  return {
    id: item.id,
    prefix: item.prefix ? `${item.prefix} ` : undefined,
    suffix: item.suffix ? `, ${item.suffix}` : undefined,
    'author-only': item.partial === 'author' || undefined,
    'suppress-author': item.partial === 'year' || undefined,
  };
}

/**
 * Render all citation clusters of one document and its bibliography with a CSL style
 *
 * The clusters must be in document order; numbering and disambiguation depend on it.
 *
 * @param data - CSL items, by id
 * @param clusters - citation clusters in document order
 * @param style - CSL style XML
 * @param lang - locale, for example `en-US`
 */
export function renderCitations(
  data: Record<string, CSL>,
  clusters: CitationCluster[],
  style: string,
  lang = 'en-US',
): RenderedCitations {
  const engine = new CSLEngine.Engine(
    { retrieveItem: (id: string) => structuredClone(data[id]), retrieveLocale },
    style,
    lang,
  );
  const { layout_prefix: open = '', layout_suffix: close = '' } = engine.citation.opt;
  const layoutDelimiter: string = engine.citation.opt.layout_delimiter ?? '; ';
  const citations = clusters.map((cluster, index) => ({
    citationID: `cluster-${index}`,
    citationItems: cluster.items.map(toCiteprocItem),
    properties: { noteIndex: 0, mode: cluster.kind === 'narrative' ? 'composite' : undefined },
  }));
  const output: [string, number, string][] = engine.rebuildProcessorState(citations, 'html');

  const fillAuthors = (html: string, ids: string[]) =>
    ids.reduce((out, id) => out.replace(NO_PRINTED_FORM, authorHtml(data[id])), html);

  const preview = (index: number, item: CitationClusterItem, kind: CitationCluster['kind']) => {
    const pre = citations.slice(0, index).map((c): [string, number] => [c.citationID, 0]);
    const post = citations.slice(index + 1).map((c): [string, number] => [c.citationID, 0]);
    const citation = {
      citationItems: [toCiteprocItem(item)],
      properties: { noteIndex: 0, mode: kind === 'narrative' ? 'composite' : undefined },
    };
    const html: string = engine.previewCitationCluster(citation, pre, post, 'html');
    return fillAuthors(html, [item.id]);
  };

  const rendered = clusters.map((cluster, index): RenderedCitationCluster => {
    const html = fillAuthors(
      output[index][2].trim(),
      cluster.items.map(({ id }) => id),
    );
    const narrative = cluster.kind === 'narrative';
    const delimiter = narrative ? ', ' : layoutDelimiter;
    const clusterOpen = narrative ? '' : open;
    const clusterClose = narrative ? '' : close;
    if (cluster.items.length === 1) {
      const [{ id }] = cluster.items;
      return {
        html,
        items: [{ id, html: stripAffixes(html, clusterOpen, clusterClose) }],
        open: clusterOpen,
        close: clusterClose,
        delimiter,
      };
    }
    // Styles can sort the items of a cluster
    const sorted: [{ id: string }, unknown][] =
      engine.registry.citationreg.citationById[citations[index].citationID]?.sortedItems ?? [];
    const order = sorted.map(([item]) => item.id);
    const items = [...cluster.items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return {
      html,
      items: items.map((item) => ({
        id: item.id,
        html: stripAffixes(preview(index, item, cluster.kind), clusterOpen, clusterClose),
      })),
      open: clusterOpen,
      close: clusterClose,
      delimiter,
    };
  });

  const [meta, entries] = engine.makeBibliography() as [{ entry_ids: string[][] }, string[]];
  const bibliography = entries.map((html, index) => ({
    id: meta.entry_ids[index][0],
    html: html.trim(),
  }));
  return { clusters: rendered, bibliography };
}
