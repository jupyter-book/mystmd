import doi from 'doi-utils';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { isUrl, tic } from 'myst-cli-utils';
import type { ISession } from './types';
import type { Resolver } from './resolvers';
import { resolveJatsUrlFromDoi } from './resolvers';

async function dowloadFromUrl(session: ISession, jatsUrl: string): Promise<string> {
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
    throw new Error(
      `⛔️ JATS may not be Open Access 😭, you should petition your local representative 🪧\n\nProblem fetching from ${jatsUrl}\n\nSTATUS ${resp.status}: ${resp.statusText}`,
    );
  }
  const contentType = resp.headers.get('content-type');
  if (!(contentType?.includes('application/xml') || contentType?.includes('text/plain'))) {
    session.log.warn(
      `Expected content-type "application/xml" instead we got "${contentType}" for ${jatsUrl}\n${chalk.dim(
        'Things may not work, but we are going to try our best...',
      )}`,
    );
  }
  const data = await resp.text();
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
  const fullXml = data.link?.find((link) => link['content-type'] === 'application/xml')?.URL;
  if (fullXml) return fullXml;
  session.log.debug(`Could not find XML in DOI record ${doiUrl}`);
  return undefined;
}

export async function downloadJatsFromUrl(
  session: ISession,
  urlOrDoi: string,
  resolvers?: Resolver[],
): Promise<string> {
  const jatsUrlFromDoi = await checkIfDoiHasJats(session, urlOrDoi);
  if (jatsUrlFromDoi) {
    const data = await dowloadFromUrl(session, jatsUrlFromDoi);
    return data;
  }
  if (doi.validate(urlOrDoi)) {
    const jatsUrl = await resolveJatsUrlFromDoi(session, urlOrDoi, resolvers);
    const data = await dowloadFromUrl(session, jatsUrl);
    return data;
  }
  if (isUrl(urlOrDoi)) {
    const data = await dowloadFromUrl(session, urlOrDoi);
    return data;
  }
  throw new Error(`Could not find ${urlOrDoi} locally, and it doesn't look like a URL or DOI`);
}
