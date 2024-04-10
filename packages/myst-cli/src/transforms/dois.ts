import fs from 'node:fs';
import { join } from 'node:path';
import type { CitationRenderer, CSL } from 'citation-js-utils';
import { getCitationRenderers, parseBibTeX, parseCSLJSON } from 'citation-js-utils';
import { doi } from 'doi-utils';
import type { Link } from 'myst-spec';
import type { GenericNode, GenericParent } from 'myst-common';
import { toText, RuleId, plural, fileError } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { computeHash, tic } from 'myst-cli-utils';
import type { Cite } from 'myst-spec-ext';
import type { SingleCitationRenderer } from './types.js';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';

const CSL_JSON_MIMETYPE = 'application/vnd.citationstyles.csl+json';
const BIBTEX_MIMETYPE = 'application/x-bibtex';

/**
 * Build a path to the cache-file for the given DOI
 *
 * @param session: CLI session
 * @param normalizedDoi: normalized DOI of the form `prefix/suffix`
 */
function doiCSLJSONCacheFile(session: ISession, normalizedDoi: string) {
  const filename = `doi-${computeHash(normalizedDoi)}.csl.json`;
  const cacheFolder = join(session.buildPath(), 'cache');
  if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder, { recursive: true });
  return join(cacheFolder, filename);
}

function doiResolvesCacheFile(session: ISession, normalizedDoi: string) {
  const filename = `doi-${computeHash(normalizedDoi)}.txt`;
  const cacheFolder = join(session.buildPath(), 'cache');
  if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder, { recursive: true });
  return join(cacheFolder, filename);
}

/**
 * Resolve the given doi.org DOI URL into its BibTeX metadata
 *
 * @param session - CLI session
 * @param url - doi.org DOI URL
 */
export async function resolveDOIAsBibTeX(
  session: ISession,
  url: string,
): Promise<CSL[] | undefined> {
  session.log.debug('Fetching DOI BibTeX from doi.org');
  const response = await session
    .fetch(url, {
      headers: [['Accept', BIBTEX_MIMETYPE]],
    })
    .catch(() => {
      session.log.debug(`Request to ${url} failed.`);
      return undefined;
    });
  if (!response || !response.ok) {
    session.log.debug(`doi.org fetch failed for ${url}`);
    return undefined;
  }
  const data = await response.text();
  return parseBibTeX(data);
}

/**
 * Resolve the given doi.org DOI URL into its CSL-JSON metadata
 *
 * @param session - CLI session
 * @param url - doi.org DOI URL
 */

export async function resolveDOIAsCSLJSON(
  session: ISession,
  url: string,
): Promise<CSL[] | undefined> {
  session.log.debug('Fetching DOI CSL JSON from doi.org');
  const response = await session
    .fetch(url, {
      headers: [['Accept', CSL_JSON_MIMETYPE]],
    })
    .catch(() => {
      session.log.debug(`Request to ${url} failed.`);
      return undefined;
    });
  if (!response || !response.ok) {
    session.log.debug(`doi.org fetch failed for ${url}`);
    return undefined;
  }
  const data = await response.json();
  // Return parse result of _array_ of CSL items
  return parseCSLJSON([data as object]);
}

/**
 * Fetch CSL-JSON formatted metadata for the given doi.org DOI
 *
 * @param session - CLI session
 * @param doiString - DOI
 * @param vfile
 * @param node
 */
export async function resolveDoiOrg(
  session: ISession,
  doiString: string,
): Promise<CSL[] | undefined> {
  const normalizedDoi = doi.normalize(doiString);
  const url = doi.buildUrl(doiString); // This must be based on the incoming string, not the normalizedDoi. (e.g. short DOIs)
  if (!doi.validate(doiString) || !normalizedDoi || !url) return undefined;

  // Cache DOI resolution as CSL JSON (parsed)
  const cachePath = doiCSLJSONCacheFile(session, normalizedDoi);

  if (fs.existsSync(cachePath)) {
    const cached = fs.readFileSync(cachePath).toString();
    session.log.debug(`Loaded cached reference CSL-JSON for doi:${normalizedDoi}`);
    return JSON.parse(cached);
  }
  const toc = tic();

  let data: CSL[] | undefined;
  try {
    data = await resolveDOIAsBibTeX(session, url);
    if (data) {
      session.log.debug(toc(`Fetched reference BibTeX for doi:${normalizedDoi} in %s`));
    } else {
      session.log.debug(
        `BibTeX not available from doi.org for doi:${normalizedDoi}, trying CSL-JSON`,
      );
    }
  } catch (error) {
    session.log.debug(
      `BibTeX from doi.org was malformed for doi:${normalizedDoi}, trying CSL-JSON`,
    );
  }
  if (!data) {
    try {
      data = await resolveDOIAsCSLJSON(session, url);
      if (data) {
        session.log.debug(toc(`Fetched reference CSL-JSON for doi:${normalizedDoi} in %s`));
      } else {
        session.log.debug(`CSL-JSON not available from doi.org for doi:${normalizedDoi}`);
      }
    } catch (error) {
      session.log.debug(`CSL-JSON from doi.org was malformed for doi:${normalizedDoi}`);
    }
  }
  if (!data) return undefined;
  session.log.debug(`Saving DOI CSL-JSON to cache ${cachePath}`);
  fs.writeFileSync(cachePath, JSON.stringify(data));
  return data as unknown as CSL[];
}

/**
 * Fetch DOI from doi.org to see if it resolves
 */
export async function doiOrgResolves(session: ISession, doiString: string): Promise<boolean> {
  const normalizedDoi = doi.normalize(doiString);
  const url = doi.buildUrl(doiString); // This must be based on the incoming string, not the normalizedDoi. (e.g. short DOIs)
  if (!doi.validate(doiString) || !normalizedDoi || !url) return false;
  const cachePath = doiResolvesCacheFile(session, normalizedDoi);
  if (fs.existsSync(cachePath)) {
    session.log.debug(`Loaded cached resolution result for doi:${normalizedDoi}`);
    return true;
  }
  const toc = tic();
  session.log.debug('Resolving doi existence from doi.org');
  const response = await session.fetch(url).catch(() => {
    session.log.debug(`Request to ${url} failed.`);
    return null;
  });
  if (!response || !response.ok) {
    session.log.debug(`doi.org fetch failed for ${doiString}`);
    return false;
  }
  session.log.debug(toc(`Resolved doi existence for doi:${normalizedDoi} in %s`));
  session.log.debug(`Saving resolution result to cache ${cachePath}`);
  fs.writeFileSync(cachePath, 'ok');
  return true;
}

export async function getCitation(
  session: ISession,
  vfile: VFile,
  doiString: string,
  node: GenericNode,
): Promise<SingleCitationRenderer | null> {
  if (!doi.validate(doiString)) return null;
  const data = await resolveDoiOrg(session, doiString);
  if (!data) {
    const resolves = await doiOrgResolves(session, doiString);
    const normalizedDoi = doi.normalize(doiString);
    let message: string;
    let note: string | undefined;
    if (resolves) {
      message = `Citation data from doi.org was not available or malformed for doi:${normalizedDoi}`;
      note = `To resolve this error, visit ${doi.buildUrl(doiString)} and add citation info to local BibTeX file`;
    } else {
      message = `Could not find DOI "${doiString}" from doi.org as doi:${normalizedDoi}`;
      note = 'Please check the DOI and, if correct, add citation info to local BibTeX file';
    }
    fileError(vfile, message, {
      node,
      ruleId: RuleId.doiLinkValid,
      note,
    });
    return null;
  }
  try {
    const renderer = await getCitationRenderers(data);
    const id = Object.keys(renderer)[0];
    const render = renderer[id];
    return { id, render };
  } catch (error) {
    fileError(
      vfile,
      `Citation data from doi.org was malformed, please edit and add to your local references`,
      {
        node,
        ruleId: RuleId.doiLinkValid,
        note: `Citation data from ${doiString}:\n\n${JSON.stringify(data)}\n`,
      },
    );
    return null;
  }
}

/**
 * Find in-line DOIs and add them to the citation renderer
 */
export async function transformLinkedDOIs(
  session: ISession,
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
    if (!doi.validate(url)) return;
    linkedDois.push(node as Link);
  });
  selectAll('cite', mdast).forEach((node: GenericNode) => {
    const { label } = node as Cite;
    if (!doi.validate(label)) return;
    citeDois.push(node as Cite);
  });
  if (linkedDois.length === 0 && citeDois.length === 0) return renderer;
  session.log.debug(
    `Found ${plural('%s DOI(s)', linkedDois.length + citeDois.length)} to auto link.`,
  );
  let number = 0;
  await Promise.all([
    ...linkedDois.map(async (node) => {
      let cite: SingleCitationRenderer | null = doiRenderer[node.url];
      if (!cite) {
        cite = await getCitation(session, vfile, node.url, node);
        if (cite) number += 1;
        else return false;
      }
      doiRenderer[node.url] = cite;
      const label = cite.render.getLabel();
      renderer[label] = cite.render;
      const citeNode = node as unknown as Cite;
      citeNode.type = 'cite';
      citeNode.kind = 'narrative';
      citeNode.label = label;
      if (doi.validate(toText(citeNode.children))) {
        // If the link text is the DOI, update with a citation in a following pass
        citeNode.children = [];
      }
      return true;
    }),
    ...citeDois.map(async (node) => {
      let cite: SingleCitationRenderer | null = doiRenderer[node.label];
      if (!cite) {
        cite = await getCitation(session, vfile, node.label, node);
        if (cite) number += 1;
        else return false;
      }
      doiRenderer[node.label] = cite;
      const label = cite.render.getLabel();
      renderer[label] = cite.render;
      node.label = label;
      return true;
    }),
  ]);
  if (number > 0) {
    session.log.info(toc(`🪄  Linked ${number} DOI${number > 1 ? 's' : ''} in %s for ${path}`));
  }
  return renderer;
}
