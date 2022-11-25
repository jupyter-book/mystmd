import checkdoi from 'doi-utils';
import fetch from 'node-fetch';
import { isUrl } from 'myst-cli-utils';
import type { ISession } from './types';
import type { Resolver } from './resolvers';
import { resolveJatsUrlFromDoi } from './resolvers';

async function dowloadFromUrl(session: ISession, jatsUrl: string): Promise<string> {
  session.log.debug(`Fetching JATS from ${jatsUrl}`);
  const jatsResp = await fetch(jatsUrl);
  if (!jatsResp.ok) throw new Error(`Problem fetching JATS from ${jatsUrl}`);
  const contentType = jatsResp.headers.get('content-type');
  if (!(contentType === 'application/xml' || contentType?.includes('text/plain'))) {
    throw new Error(
      `Expected content-type "application/xml" instead we got ${contentType} for ${jatsUrl}`,
    );
  }
  const data = await jatsResp.text();
  return data;
}

export async function downloadJatsFromUrl(
  session: ISession,
  urlOrDoi: string,
  resolvers?: Resolver[],
): Promise<string> {
  if (checkdoi.validate(urlOrDoi)) {
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
