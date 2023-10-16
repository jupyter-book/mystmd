import type { CitationRenderer } from 'citation-js-utils';
import { getCitations } from 'citation-js-utils';
import { doi } from 'doi-utils';
import type { Link } from 'myst-spec';
import type { GenericNode, GenericParent } from 'myst-common';
import { fileWarn, toText, RuleId } from 'myst-common';
import { selectAll } from 'unist-util-select';
import fetch from 'node-fetch';
import { plural, tic } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import type { Cite } from 'myst-spec-ext';
import type { SingleCitationRenderer } from './types.js';
import type { VFile } from 'vfile';

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

async function getCitation(
  log: Logger,
  vfile: VFile,
  doiString: string,
  node: GenericNode,
): Promise<SingleCitationRenderer | null> {
  if (!doi.validate(doi.normalize(doiString))) return null;
  const bibtex = await getDoiOrgBibtex(log, doiString);
  if (!bibtex) {
    fileWarn(vfile, `Could not find DOI from link: ${doiString} as ${doi.normalize(doiString)}`, {
      node,
      ruleId: RuleId.doiLinkValid,
    });
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
  vfile: VFile,
  mdast: GenericParent,
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
  log.debug(`Found ${plural('%s DOI(s)', linkedDois.length + citeDois.length)} to auto link.`);
  let number = 0;
  await Promise.all([
    ...linkedDois.map(async (node) => {
      let cite: SingleCitationRenderer | null = doiRenderer[node.url];
      if (!cite) {
        cite = await getCitation(log, vfile, node.url, node);
        if (cite) number += 1;
        else return false;
      }
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
      let cite: SingleCitationRenderer | null = doiRenderer[node.label];
      if (!cite) {
        cite = await getCitation(log, vfile, node.label, node);
        if (cite) number += 1;
        else return false;
      }
      doiRenderer[node.label] = cite;
      renderer[cite.id] = cite.render;
      node.label = cite.id;
      return true;
    }),
  ]);
  if (number > 0) {
    log.info(toc(`🪄  Linked ${number} DOI${number > 1 ? 's' : ''} in %s for ${path}`));
  }
  return renderer;
}
