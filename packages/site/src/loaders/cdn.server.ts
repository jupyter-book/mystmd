import type { GenericNode } from 'mystjs';
import { selectAll } from 'unist-util-select';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';
import { walkPaths } from '@curvenote/nbtx/dist/minify/utils';
import type {
  ManifestProjectPage,
  PageLoader as Data,
  SiteManifest as Config,
} from '@curvenote/site-common';
import { responseNoArticle, responseNoSite } from './errors.server';
import { getFooterLinks, getProject } from './utils';
import { redirect } from '@remix-run/node';

interface CdnRouter {
  cdn?: string;
}

declare global {
  // Disable multiple caches when this file is rebuilt
  // eslint-disable-next-line
  var cdnRouterCache: NodeCache | undefined, configCache: NodeCache | undefined;
}

const CDN = 'https://cdn.curvenote.com/';

function getCdnRouterCache() {
  if (global.cdnRouterCache) return global.cdnRouterCache;
  console.log('Creating cdnRouterCache');
  // The router should update every minute
  global.cdnRouterCache = new NodeCache({ stdTTL: 30 });
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
  const response = await fetch(`https://api.curvenote.com/routers/${hostname}`);
  if (response.status === 404) {
    // Always hit the API again if it is not found!
    return;
  }
  const data = (await response.json()) as CdnRouter;
  getCdnRouterCache().set<CdnRouter>(hostname, data);
  return data.cdn;
}

function withCDN<T extends string | undefined>(id: string, url: T): T {
  if (!url) return url;
  return `${CDN}${id}/public${url}` as T;
}

export async function getConfig(hostname: string): Promise<Config> {
  const id = await getCdnPath(hostname);
  if (!id) throw responseNoSite();
  const cached = getConfigCache().get<Config>(id);
  // Load the data from an in memory cache.
  if (cached) return cached;
  const response = await fetch(`${CDN}${id}/config.json`);
  if (response.status === 404) throw responseNoSite();
  const data = (await response.json()) as Config;
  data.id = id;
  data.actions.forEach((action) => {
    if (!action.static) return;
    action.url = withCDN(id, action.url);
  });
  data.logo = withCDN(id, data.logo);
  // Update the thumbnails to point at the CDN
  data.projects.forEach((project) => {
    project.pages
      .filter((page): page is ManifestProjectPage => 'slug' in page)
      .forEach((page) => {
        if (page.thumbnail) page.thumbnail = withCDN(id, page.thumbnail);
        if (page.thumbnailOptimized) page.thumbnailOptimized = withCDN(id, page.thumbnailOptimized);
      });
  });
  getConfigCache().set<Config>(id, data);
  return data;
}

export async function getObjectsInv(hostname: string): Promise<ArrayBuffer | undefined> {
  const id = await getCdnPath(hostname);
  if (!id) return;
  const url = `${CDN}${id}/public/_static/objects.inv`;
  const response = await fetch(url);
  if (response.status === 404) return;
  const buffer = await response.arrayBuffer();
  return buffer;
}

export async function getData(
  config?: Config,
  project?: string,
  slug?: string,
): Promise<Data | null> {
  if (!project || !slug || !config) throw responseNoArticle();
  const { id } = config;
  if (!id) throw responseNoSite();
  const response = await fetch(`${CDN}${id}/content/${project}/${slug}.json`);
  if (response.status === 404) throw responseNoArticle();
  const data = (await response.json()) as Data;
  if (data?.frontmatter?.thumbnail) {
    data.frontmatter.thumbnail = withCDN(id, data.frontmatter.thumbnail);
  }
  if (data?.frontmatter?.thumbnailOptimized) {
    data.frontmatter.thumbnailOptimized = withCDN(id, data.frontmatter.thumbnailOptimized);
  }
  // Fix all of the images to point to the CDN
  const images = selectAll('image', data.mdast) as GenericNode[];
  images.forEach((node) => {
    node.url = withCDN(id, node.url);
    if (node.urlOptimized) {
      node.urlOptimized = withCDN(id, node.urlOptimized);
    }
  });
  const links = selectAll('link,linkBlock,card', data.mdast) as GenericNode[];
  const staticLinks = links.filter((node) => node.static);
  staticLinks.forEach((node) => {
    // These are static links to thinks like PDFs or other referenced files
    node.url = withCDN(id, node.url);
  });
  const outputs = selectAll('output', data.mdast) as GenericNode[];
  outputs.forEach((node) => {
    if (!node.data) return;
    walkPaths(node.data, (path, obj) => {
      obj.path = withCDN(id, path);
      obj.content = withCDN(id, obj.content as string);
    });
  });
  return data;
}

export async function getPage(
  hostname: string,
  opts: { domain?: string; folder?: string; loadIndexPage?: boolean; slug?: string },
) {
  const folderName = opts.folder;
  const config = await getConfig(hostname);
  if (!config) throw responseNoSite();
  const folder = getProject(config, folderName);
  if (!folder) throw responseNoArticle();
  if (opts.slug === folder.index) {
    return redirect(`/${folderName}`);
  }
  const slug = opts.loadIndexPage ? folder.index : opts.slug;
  const loader = await getData(config, folderName, slug).catch((e) => {
    console.error(e);
    return null;
  });
  if (!loader) throw responseNoArticle();
  const footer = getFooterLinks(config, folderName, slug);
  return { ...loader, footer, domain: opts.domain };
}
