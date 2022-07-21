import fs from 'fs';
import path from 'path';
import configJson from '~/config.json';
import { getDomainFromRequest, PageLoader as Data, SiteManifest } from '@curvenote/site-common';
import { redirect } from '@remix-run/node';
import { getFooterLinks, getProject, responseNoArticle, responseNoSite } from '@curvenote/site';

// This is executed in the API directory
const contentFolder = path.join(__dirname, '..', 'app', 'content');

export function getConfig(): SiteManifest {
  return configJson as unknown as SiteManifest;
}

/**
 * This function loads the data from disk in your app/content folder.
 *
 * - Use `curvenote start` to create the content
 * - Use `curvenote start -c` to clean the cache
 *
 * Note the above method for accessing the filesystem directly
 * does **not** work when you deploy to vercel in a serverless
 * funciton.
 *
 * Instead, use `curvenote deploy` to get access to your content.
 *
 * If you want to customize your site, you can still use Curvenote
 * as a CMS (content management system) to deliver your content on
 * a global CDN.
 *
 * Alternatively, if you want to deploy your own content, you can
 * serve it on your own CDN, with a Database to point to the versions.
 *
 * Or if your site is small, you can load it into memory on the
 * cloud function, however, this can have performance issues.
 *
 * ```typescript
 * const CACHE: {
 *   isLoaded: boolean;
 *   data: Record<string, Record<string, Data>>;
 * } = {
 *   isLoaded: false,
 *   data: {},
 * };
 *
 * export async function getConfig(): Promise<SiteManifest | undefined> {
 *   return config;
 * }
 *
 * async function getAllData(): Promise<Record<string, Record<string, Data>>> {
 *   if (CACHE.isLoaded) return CACHE.data;
 *   // Load all content into memory 🤷‍♂️
 *   // START LOAD
 *   CACHE.data['demo'] = {};
 *   CACHE.data['demo']['index'] = await import('~/content/demo/index.json');
 *   CACHE.data['demo']['admonitions'] = await import('~/content/demo/admonitions.json');
 *   CACHE.data['demo']['interactive'] = await import('~/content/demo/interactive.json');
 *   // END LOAD
 *   CACHE.isLoaded = true;
 *   return CACHE.data;
 * }
 *
 * export async function getData(
 *   config?: Config,
 *   folder?: string,
 *   slug?: string,
 * ): Promise<Data | null> {
 *   if (!folder || !slug) return null;
 *   const allData = await getAllData();
 *   const data = allData[folder]?.[slug] ?? null;
 *   return data;
 * }
 * ```
 */
async function getData(
  config?: SiteManifest,
  folder?: string,
  slug?: string,
): Promise<Data | null> {
  if (!folder || !slug) return null;
  const filename = path.join(contentFolder, folder, `${slug}.json`);
  if (!fs.existsSync(filename)) return null;
  const contents = fs.readFileSync(filename).toString();
  return JSON.parse(contents);
}

export async function getPage(
  request: Request,
  opts: { folder?: string; loadIndexPage?: boolean; slug?: string },
) {
  const folderName = opts.folder;
  const config = getConfig();
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
  return { ...loader, footer, domain: getDomainFromRequest(request) };
}
