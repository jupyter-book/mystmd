import checkdoi from 'doi-utils';
import fetch from 'node-fetch';
import type { ISession } from './types';

export interface Resolver {
  test: (url: string) => boolean;
  jatsUrl: (url: string) => string;
}

export const elife: Resolver = {
  test(url: string) {
    return new URL(url).hostname === 'elifesciences.org';
  },
  jatsUrl(url: string) {
    return `${url}.xml`;
  },
};

export const plos: Resolver = {
  test(url: string) {
    return new URL(url).hostname === 'journals.plos.org';
  },
  jatsUrl(url: string) {
    return url.replace('/article?', '/article/file?') + '&type=manuscript';
  },
};

export const joss: Resolver = {
  test(url: string) {
    return new URL(url).hostname === 'joss.theoj.org';
  },
  jatsUrl(url: string) {
    // Probably a better way to do this, the joss papers on on github!
    const doi = new URL(url).pathname.replace('/papers/', '');
    const [org, jossId] = doi.split('/');
    const id = jossId.split('.')[1];
    return `https://raw.githubusercontent.com/openjournals/joss-papers/master/joss.${id}/${org}.${jossId}.jats`;
  },
};

export const DEFAULT_RESOLVERS: Resolver[] = [elife, plos, joss];

export async function resolveJatsUrlFromDoi(
  session: ISession,
  doi: string,
  resolvers = DEFAULT_RESOLVERS,
): Promise<string> {
  if (!checkdoi.validate(doi)) throw new Error(`The doi ${doi} is not valid`);
  const doiUrl = checkdoi.buildUrl(doi) as string;
  session.log.debug(`Resolving DOI ${doiUrl}`);
  const resp = await fetch(doiUrl);
  const articleUrl = resp.url;
  session.log.debug(`Found resolved URL for DOI at ${articleUrl}`);
  const resolver = resolvers.find((r) => r.test(articleUrl));
  if (!resolver) throw new Error(`Could not resolve JATS for ${articleUrl}, no resolver matched`);
  const jatsUrl = resolver.jatsUrl(articleUrl);
  return jatsUrl;
}
