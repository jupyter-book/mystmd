import { GenericNode, selectAll } from 'mystjs';
import NodeCache from 'node-cache';
import { URL } from 'url';
import { PageLoader as Data, Config } from './types';

interface CdnRouter {
  cdn?: string;
}

declare global {
  // Disable multiple caches when this file is rebuilt
  // eslint-disable-next-line
  var cdnRouterCache: NodeCache | undefined, configCache: NodeCache | undefined;
}

function getCdnRouterCache() {
  if (global.cdnRouterCache) return global.cdnRouterCache;
  console.log('Creating cdnRouterCache');
  // The router should update every minute
  global.cdnRouterCache = new NodeCache({ stdTTL: 60 });
  return global.cdnRouterCache;
}

function getConfigCache() {
  if (global.configCache) return global.configCache;
  console.log('Creating configCache');
  // The config can be long lived as it is static (0 == ∞)
  global.configCache = new NodeCache({ stdTTL: 0 });
  return global.configCache;
}

async function getCdnPath(hostname: string): Promise<string | undefined> {
  const cached = getCdnRouterCache().get<CdnRouter>(hostname);
  if (cached) return cached.cdn;
  const response = await fetch(`https://api.curvenote.com/sites/router/${hostname}`);
  if (response.status === 404) {
    // Leave a blank record so we stop hitting the API!
    getCdnRouterCache().set(hostname, { cdn: undefined });
    return;
  }
  const data = (await response.json()) as CdnRouter;
  getCdnRouterCache().set<CdnRouter>(hostname, data);
  return data.cdn;
}

function withCDN(id: string, url?: string): string | undefined {
  if (!url) return url;
  return `https://cdn.curvenote.com/${id}/public${url}`;
}

export async function getConfig(request: Request): Promise<Config | undefined> {
  const url = new URL(request.url);
  const id = await getCdnPath(url.hostname);
  if (!id) return undefined;
  const cached = getConfigCache().get<Config>(id);
  // Load the data from an in memory cache.
  if (cached) return cached;
  const response = await fetch(`https://cdn.curvenote.com/${id}/config.json`);
  if (response.status === 404) return undefined;
  const data = (await response.json()) as Config;
  data.site.id = id;
  data.site.logo = withCDN(id, data.site.logo);
  getConfigCache().set<Config>(id, data);
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
  const outputs = selectAll('output', data.mdast) as GenericNode[];
  outputs.forEach((node) => {
    const items = (node.data?.items ?? {}) as Record<string, { path?: string }>;
    Object.entries(items).forEach(([, data]) => {
      if (!data?.path) return;
      data.path = withCDN(id, data.path);
    });
  });
  return data;
}
