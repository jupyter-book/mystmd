import type { CitationRenderer } from 'citation-js-utils';
import { getCitations } from 'citation-js-utils';
import doi from 'doi-utils';
import type { Link } from 'myst-spec';
import type { GenericNode } from 'myst-common';
import { selectAll } from 'unist-util-select';
import fetch from 'node-fetch';
import { tic } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import type { Root } from 'mdast';
import { toText } from 'myst-common';
import type { Cite } from './citations';
import type { SingleCitationRenderer } from './types';

async function getDoiOrgBibtex(log: Logger, doiString: string): Promise<string | null> {
  if (!doi.validate(doi.normalize(doiString))) return null;
  const toc = tic();
  log.debug('Fetching DOI information from doi.org');
  const url = `https://doi.org/${doi.normalize(doiString)}`;
  const response = await fetch(url, {
    headers: [['Accept', 'application/x-bibtex']],
  }).catch(() => {
    log.debug(`Request to ${url} failed.`);
    return null;
  });
  if (!response || !response.ok) {
    log.debug(`doi.org fetch failed for ${doiString}}`);
    return null;
  }
  const bibtex = await response.text();
  log.debug(toc(`Fetched reference information doi:${doi.normalize(doiString)} in %s`));
  return bibtex;
}

async function getCitation(log: Logger, doiString: string): Promise<SingleCitationRenderer | null> {
  if (!doi.validate(doi.normalize(doiString))) return null;
  const bibtex = await getDoiOrgBibtex(log, doiString);
  if (!bibtex) {
    log.warn(`⚠️  Could not find DOI from link: ${doiString} as ${doi.normalize(doiString)}`);
    return null;
  }
  const renderer = await getCitations(bibtex);
  const id = Object.keys(renderer)[0];
  const render = renderer[id];
  return { id, render };
}

/**
 * Find in-line DOIs and add them to the citation renderer
 */
export async function transformLinkedDOIs(
  log: Logger,
  mdast: Root,
  doiRenderer: Record<string, SingleCitationRenderer>,
  path: string,
): Promise<CitationRenderer> {
  const toc = tic();
  const renderer: CitationRenderer = {};
  const linkedDois: Link[] = [];
  const citeDois: Cite[] = [];
  selectAll('link', mdast).forEach((node: GenericNode) => {
    const { url } = node as Link;
    if (!doi.validate(doi.normalize(url))) return;
    linkedDois.push(node as Link);
  });
  selectAll('cite', mdast).forEach((node: GenericNode) => {
    const { label } = node as Cite;
    if (!doi.validate(doi.normalize(label))) return;
    citeDois.push(node as Cite);
  });
  if (linkedDois.length === 0 && citeDois.length === 0) return renderer;
  log.debug(`Found ${linkedDois.length + citeDois.length} DOIs to auto link.`);
  const before = Object.keys(doiRenderer).length;
  await Promise.all([
    ...linkedDois.map(async (node) => {
      const cite = doiRenderer[node.url] ?? (await getCitation(log, node.url));
      if (!cite) return false;
      doiRenderer[node.url] = cite;
      renderer[cite.id] = cite.render;
      const citeNode = node as unknown as Cite;
      citeNode.type = 'cite';
      citeNode.kind = 'narrative';
      citeNode.label = cite.id;
      if (doi.validate(doi.normalize(toText(citeNode.children)))) {
        // If the link text is the DOI, update with a citation in a following pass
        citeNode.children = [];
      }
      return true;
    }),
    ...citeDois.map(async (node) => {
      const cite = doiRenderer[node.label] ?? (await getCitation(log, node.label));
      if (!cite) return false;
      doiRenderer[node.label] = cite;
      renderer[cite.id] = cite.render;
      node.label = cite.id;
      return true;
    }),
  ]);
  const after = Object.keys(doiRenderer).length;
  const number = after - before;
  if (number > 0) {
    log.info(toc(`🪄 Linked ${number} DOI${number > 1 ? 's' : ''} in %s for ${path}`));
  }
  return renderer;
}
