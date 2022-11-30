import doi from 'doi-utils';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { isUrl, tic } from 'myst-cli-utils';
import { formatPrinciples, highlightFAIR } from 'fair-principles';
import type { ISession } from './types';
import type { Resolver } from './resolvers';
import { customResolveJatsUrlFromDoi } from './resolvers';

function logAboutJatsFailing(session: ISession, jatsUrls: string[]) {
  session.log.warn(
    '⛔️ JATS may not be Open Access 😭, you should petition your local representative 🪧',
  );
  session.log.info(
    `${chalk.green(`\nThe XML ${chalk.bold('should')} be here:\n\n${jatsUrls.join('\n')}`)}\n`,
  );
  const FAIR = highlightFAIR('A', { chalk });
  session.log.info(`Some publishers aggressively block programmatic access, which isn't ${FAIR}.`);
  session.log.debug(formatPrinciples('A*', { chalk }));
  session.log.info(`${chalk.blue('The link may work in a browser.')}\n`);
}

async function dowloadFromUrl(session: ISession, jatsUrl: string): Promise<string> {
  const toc = tic();
  session.log.debug(`Fetching JATS from ${jatsUrl}`);
  const resp = await fetch(jatsUrl, {
    headers: [
      ['accept', 'application/xml'],
      [
        'user-agent',
        // A bunch of publishers just show the login screen or quickly block you.
        // We don't want to DDOS these publishers, they are the _good ones_ for sharing the XML!!
        // But some block on the second request?!
        // So we can pretend to be a random browser, I guess. How silly. 🤷‍♂️
        `Mozilla/5.0 (Macintosh; Intel Mac OS X ${Math.floor(Math.random() * 100)})`,
      ],
    ],
  });
  if (!resp.ok) {
    session.log.debug(`JATS failed to download from "${jatsUrl}"`);
    throw new Error(`STATUS ${resp.status}: ${resp.statusText}`);
  }
  const contentType = resp.headers.get('content-type');
  if (
    !(
      contentType?.includes('application/xml') ||
      contentType?.includes('text/xml') ||
      contentType?.includes('text/plain')
    )
  ) {
    session.log.warn(
      `Expected content-type "application/xml" instead we got "${contentType}" for ${jatsUrl}\n${chalk.dim(
        'Things may not work, but we are going to try our best...',
      )}`,
    );
  }
  const data = await resp.text();
  session.log.debug(toc(`Fetched document with content-type "${contentType}" in %s`));
  return data;
}

type DoiLink = {
  URL: string;
  'content-type'?: 'application/xml' | 'application/pdf' | 'unspecified' | string;
  'content-version'?: 'vor' | string;
  'intended-application': 'text-mining' | 'similarity-checking' | string;
};

/**
 * There are 5.8M or so DOIs that have a full XML record:
 *
 * https://api.crossref.org/works?filter=full-text.type:application/xml,full-text.application:text-mining&facet=publisher-name:*&rows=0
 *
 * This function tries to find the correct URL for the record.
 */
async function checkIfDoiHasJats(session: ISession, urlOrDoi: string): Promise<string | undefined> {
  if (!doi.validate(urlOrDoi)) return;
  const toc = tic();
  const doiUrl = doi.buildUrl(urlOrDoi) as string;
  session.log.debug(`Attempting to resolving full XML from DOI ${doiUrl}`);
  const resp = await fetch(doiUrl, { headers: [['Accept', 'application/json']] });
  if (!resp.ok) {
    // Silently return -- other functions can try!
    session.log.debug(`DOI failed to resolve: ${doiUrl}`);
    return;
  }
  const data = (await resp.json()) as { link?: DoiLink[] };
  session.log.debug(toc(`DOI resolved in %s with ${data.link?.length ?? 0} links to content`));
  if (data.link) {
    session.log.debug(
      ['', ...data.link.map((link) => `content-type: ${link['content-type']}, ${link.URL}\n`)].join(
        '  - ',
      ),
    );
  }
  const fullXml = data.link?.find((link) =>
    ['text/xml', 'application/xml'].includes(link['content-type'] ?? ''),
  )?.URL;
  if (fullXml) return fullXml;
  session.log.debug(`Could not find XML in DOI record ${doiUrl}`);
  return undefined;
}

type OpenAlexWork = {
  ids: {
    openalex?: string;
    doi?: string;
    mag?: string;
    pmid?: string;
    pmcid?: string;
  };
};

/**
 * https://www.ncbi.nlm.nih.gov/pmc/tools/id-converter-api/
 */
export async function convertPMID2PMCID(
  session: ISession,
  PMID: string,
): Promise<string | undefined> {
  if (PMID.startsWith('https://')) {
    const idPart = new URL(PMID).pathname.slice(1);
    session.log.debug(`Extract ${PMID} to ${idPart}`);
    return convertPMID2PMCID(session, idPart);
  }
  const toc = tic();
  const converter = 'https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/';
  const resp = await fetch(`${converter}?tool=jats-xml&format=json&ids=${PMID}`, {
    headers: [['Accept', 'application/json']],
  });
  if (!resp.ok) {
    // Silently return -- other functions can try!
    session.log.debug(`Failed to convert PubMedID: ${PMID}`);
    return;
  }
  const data = await resp.json();
  const PMCID = data?.records?.[0]?.pmcid;
  session.log.debug(toc(`Used nih.gov to transform ${PMID} to ${PMCID} in %s.`));
  return PMCID;
}

function pubMedCentralJats(PMCID: string) {
  const normalized = PMCID.replace(/^PMC:?/, '');
  return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${normalized}`;
}

export async function checkIfPubMedCentralHasJats(
  session: ISession,
  urlOrDoi: string,
): Promise<string | undefined> {
  if (urlOrDoi.match(/^PMC:?([0-9]+)$/)) return pubMedCentralJats(urlOrDoi);
  if (!doi.validate(urlOrDoi)) return;
  const toc = tic();
  const doiUrl = doi.buildUrl(urlOrDoi) as string;
  session.log.debug(`Attempting to resolve PMCID using OpenAlex from ${doiUrl}`);
  const openAlexUrl = `https://api.openalex.org/works/${doiUrl}`;
  const resp = await fetch(openAlexUrl, { headers: [['Accept', 'application/json']] });
  if (!resp.ok) {
    // Silently return -- other functions can try!
    session.log.debug(`Failed to lookup on OpenAlex: ${openAlexUrl}`);
    return;
  }
  const data = (await resp.json()) as OpenAlexWork;
  const PMID = data?.ids?.pmid;
  let PMCID = data?.ids?.pmcid;
  if (!PMCID && !!PMID) {
    session.log.debug(
      toc(`OpenAlex resolved ${data?.ids.openalex} in %s. There is no PMCID, but there is a PMID`),
    );
    PMCID = await convertPMID2PMCID(session, PMID);
    if (!PMCID) {
      session.log.debug(toc(`PubMed does not have a record of ${PMID}`));
      return;
    }
  }
  if (!PMCID) {
    session.log.debug(toc(`OpenAlex resolved ${data?.ids.openalex} in %s, but there is no PMCID`));
    return;
  }
  session.log.debug(toc(`OpenAlex resolved in %s, with a PMCID of ${PMCID}`));
  return pubMedCentralJats(PMCID);
}

export async function downloadJatsFromUrl(
  session: ISession,
  urlOrDoi: string,
  resolvers?: Resolver[],
): Promise<{ source: string; data: string }> {
  const expectedUrls = (
    await Promise.all([
      checkIfPubMedCentralHasJats(session, urlOrDoi),
      checkIfDoiHasJats(session, urlOrDoi),
    ])
  ).filter((u): u is string => !!u);
  if (expectedUrls.length > 0) {
    session.log.debug(['Trying URLs:\n', ...expectedUrls.map((url) => ` ${url}\n`)].join('  - '));
    for (let index = 0; index < expectedUrls.length; index++) {
      const url = expectedUrls[index];
      try {
        const data = await dowloadFromUrl(session, url);
        if (data) return { source: url, data };
      } catch (error) {
        session.log.debug((error as Error).message);
      }
    }
    // If there are expected URLs that don't work: see something, say something, etc.
    logAboutJatsFailing(session, expectedUrls);
  }
  if (doi.validate(urlOrDoi)) {
    const jatsUrl = await customResolveJatsUrlFromDoi(session, urlOrDoi, resolvers);
    const data = await dowloadFromUrl(session, jatsUrl);
    return { source: jatsUrl, data };
  }
  if (isUrl(urlOrDoi)) {
    session.log.debug(
      "No resolver matched, and the URL doesn't look like a DOI. We will attempt to download it directly.",
    );
    const data = await dowloadFromUrl(session, urlOrDoi);
    return { source: urlOrDoi, data };
  }
  throw new Error(`Could not find ${urlOrDoi} locally, and it doesn't look like a URL or DOI`);
}
