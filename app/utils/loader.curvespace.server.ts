import { GenericNode, selectAll } from 'mystjs';
import { URL } from 'url';
import { PageLoader as Data, Config } from './types';

const pathToID: Record<string, string> = {
  localhost: 'f6b98123s',
  'climasoma.curve.space': 'f6b98123s',
  'test.curve.space': 'rq5taz4gz',
};

const cache: Record<string, Config> = {};

function withCDN(id: string, url?: string): string | undefined {
  if (!url) return url;
  return `https://cdn.curvenote.com/${id}/static${url}`;
}

export async function getConfig(request: Request): Promise<Config | undefined> {
  const url = new URL(request.url);
  const id = pathToID[url.hostname];
  if (cache[id]) {
    // Load the data from an in memory cache.
    return cache[id];
  }
  const response = await fetch(`https://cdn.curvenote.com/${id}/config.json`);
  if (response.status === 404) return undefined;
  const data = (await response.json()) as Config;
  data.site.id = id;
  data.site.logo = withCDN(id, data.site.logo);
  cache[id] = data;
  return data;
}

export async function getData(
  config?: Config,
  folder?: string,
  slug?: string,
): Promise<Data | null> {
  if (!folder || !slug || !config) return null;
  const { id } = config.site;
  const response = await fetch(
    `https://cdn.curvenote.com/${id}/content/${folder}/${slug}.json`,
  );
  if (response.status === 404) return null;
  const data = (await response.json()) as Data;
  // Fix all of the images to point to the CDN
  const images = selectAll('image', data.mdast) as GenericNode[];
  images.forEach((node) => {
    node.url = withCDN(id, node.url);
  });
  return data;
}
