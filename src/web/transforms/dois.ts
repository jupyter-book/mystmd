import fetch from 'node-fetch';
import { Link } from 'myst-spec';
import { validate, normalize } from 'doi-utils';
import { GenericNode, selectAll } from 'mystjs';
import { CitationRenderer, getCitations } from 'citation-js-utils';
import chalk from 'chalk';
import { Root, TransformState } from './types';
import { Cite } from './citations';
import { Logger } from '../../logging';
import { tic } from '../../export/utils/exec';
import { ISession } from '../../session';

async function getDoiOrgBibtex(log: Logger, doi: string): Promise<string | null> {
  if (!validate(normalize(doi))) return null;
  const toc = tic();
  log.debug('Fetching DOI information from doi.org');
  const response = await fetch(`https://doi.org/${normalize(doi)}`, {
    headers: [['Accept', 'application/x-bibtex']],
  });
  if (!response.ok) {
    log.debug(`doi.org fetch failed for ${doi}}`);
    return null;
  }
  const bibtex = await response.text();
  log.debug(toc(`Fetched reference information doi:${normalize(doi)} in %s`));
  return bibtex;
}

async function getCitation(
  log: Logger,
  doi: string,
): Promise<{ id: string; render: CitationRenderer[''] } | null> {
  if (!validate(normalize(doi))) return null;
  const bibtex = await getDoiOrgBibtex(log, doi);
  if (!bibtex) {
    log.warn(`⚠️  Could not find DOI: ${doi}`);
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
export async function transformLinkedDOIs(log: Logger, mdast: Root, renderer: CitationRenderer) {
  const toc = tic();
  const linkedDois: Link[] = [];
  selectAll('link', mdast).forEach((node: GenericNode) => {
    const { url } = node as Link;
    if (!validate(normalize(url))) return;
    linkedDois.push(node as Link);
  });
  if (linkedDois.length === 0) return;
  log.debug(`Found ${linkedDois.length} DOIs to auto link.`);
  const success = await Promise.all(
    linkedDois.map(async (node) => {
      const cite = await getCitation(log, node.url);
      if (!cite) return false;
      renderer[cite.id] = cite.render;
      const citeNode = node as unknown as Cite;
      citeNode.type = 'cite';
      citeNode.kind = 'narrative';
      citeNode.label = cite.id;
      // Leave the children as is
      return true;
    }),
  );
  const number = success.filter((r) => r).length;
  const error =
    linkedDois.length === number
      ? ''
      : chalk.dim(` (⚠️ failed to link ${linkedDois.length - number})`);
  log.info(toc(`🪄 Linked ${number} DOI${number > 1 ? 's' : ''} in %s${error}`));
}
