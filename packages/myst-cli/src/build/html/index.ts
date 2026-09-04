// Static-build HTML pipeline for MyST sites.
//
// The myst-theme (a separate repo) is the React/Remix app that renders MyST documents.
// For a static build we spin myst-theme up as a local Remix server, fetch every route as fully-rendered HTML, and write the results to disk.
// This file does that in `buildHtml`, plus a small post-processing pass (`rewriteAssetsFolder`) that:
// - rewrites asset URLs
// - injects an `/foo/index.html` -> `/foo/` redirect script
//
// The JS and CSS are produced by myst-theme.

import fs from 'fs-extra';
import path from 'node:path';
import { writeFileToFolder } from 'myst-cli-utils';
import type { MystXRefs } from 'myst-transforms';
import type { ISession } from '../../session/types.js';
import type { StartOptions } from '../site/start.js';
import { startServer } from '../site/start.js';
import { getSiteTemplate } from '../site/template.js';
import { slugToUrl } from 'myst-common';
import pLimit from 'p-limit';
import { fetchWithRetry } from '../../utils/fetchWithRetry.js';
import { selectors } from '../../store/index.js';
import { copyStaticFiles } from '../../utils/copyStaticFiles.js';
import type { LocalProjectPage } from '../../project/types.js';

const limitConnections = pLimit(5);

export async function currentSiteRoutes(
  session: ISession,
  host: string,
  baseurl: string | undefined,
): Promise<{ url: string; path: string; binary?: boolean; optional?: boolean }[]> {
  const state = session.store.getState();
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  // Without a configured favicon, the theme falls back to fetching a default
  // icon from mystmd.org; that fetch is optional, so that if the remote site is
  // down it doesn't break the build.
  const hasFavicon = !!siteConfig?.options?.favicon;
  return (siteConfig?.projects ?? [])
    ?.map((proj) => {
      if (!proj.path) return [];
      const localProj = selectors.selectLocalProject(state, proj.path);
      if (!localProj) return [];
      const projSlug = proj.slug ? `/${proj.slug}` : '';
      // We need to get the index from a slug page to make remix happy
      // If this gets from the index, then the site will trigger the wrong render path
      // And then hydration does not match
      const siteIndex = baseurl ? `/${localProj.index}` : '';
      const pages = localProj.pages.filter(
        (page): page is LocalProjectPage => !!(page as any).slug,
      );
      return [
        { url: `${host}${projSlug}${siteIndex}`, path: path.join(proj.slug ?? '', 'index.html') },
        ...pages.map((page) => {
          const pageSlug = slugToUrl(page.slug);
          return {
            url: `${host}${projSlug}/${pageSlug}`,
            path: path.join(proj.slug ?? '', `${pageSlug}/index.html`),
          };
        }),
        // Download all of the configured JSON
        {
          url: `${host}${projSlug}/${localProj.index}.json`,
          path: path.join(proj.slug ?? '', `${localProj.index}.json`),
        },
        ...pages.map((page) => {
          return {
            url: `${host}${projSlug}/${page.slug}.json`,
            path: path.join(proj.slug ?? '', `${page.slug}.json`),
          };
        }),
        // Download other assets
        ...['robots.txt', 'myst-theme.css', 'sitemap.xml', 'sitemap_style.xsl'].map((asset) => ({
          url: `${host}/${asset}`,
          path: asset,
        })),
        {
          url: `${host}/favicon.ico`,
          path: 'favicon.ico',
          binary: true,
          optional: !hasFavicon,
        },
      ];
    })
    .flat();
}

// This is defined in the remix `publicPath` and allows us to overwrite it here.
const ASSETS_FOLDER = 'myst_assets_folder';

// Script injected at the end of <head> in every index.html to redirect
// "/foo/index.html" → "/foo/" before Remix hydrates, preventing a URL
// mismatch that breaks client-side routing. Remix renders the root index
// for URL "/" but static servers also serve the same file at "/index.html",
// where the URL doesn't match any Remix route → runtime error.
const INDEX_REDIRECT_SCRIPT =
  `<script>(function(){` +
  `var p=window.location.pathname;` +
  `if(p.endsWith('/index.html'))` +
  `window.location.replace((p.slice(0,-10)||'/')+window.location.search+window.location.hash);` +
  `})();</script>`;

/**
 * Rewrite URLs in HTML/JS/JSON files pointing to the default assets folder in
 * terms of the provided base URL, and append a URL-normalisation script to
 * the end of <head> in every index.html so that direct access via
 * /foo/index.html redirects to /foo/.
 *
 * @param directory directory of files to recursively rewrite
 * @param baseurl base URL of the built site
 */
function rewriteAssetsFolder(directory: string, baseurl?: string): void {
  fs.readdirSync(directory).forEach((filename) => {
    const file = path.join(directory, filename);
    if (fs.statSync(file).isDirectory()) {
      rewriteAssetsFolder(file, baseurl);
      return;
    }
    if (path.extname(file) === '.map') {
      fs.rmSync(file);
      return;
    }
    if (!['.html', '.js', '.json'].includes(path.extname(file))) return;
    let data = fs.readFileSync(file).toString();
    data = data.replace(new RegExp(`\\/${ASSETS_FOLDER}\\/`, 'g'), `${baseurl || ''}/build/`);
    if (filename === 'index.html') {
      data = data.replace('</head>', `${INDEX_REDIRECT_SCRIPT}</head>`);
    }
    fs.writeFileSync(file, data);
  });
}

/**
 * Return the configured public site URL, when one is available.
 *
 * @param session session with logging
 */
function getSiteUrl(session: ISession): string | undefined {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const value = process.env.SITE_URL ?? siteConfig?.url ?? process.env.READTHEDOCS_CANONICAL_URL;
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`SITE_URL or site.url must be an absolute URL: ${value}`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash) {
    throw new Error(
      `SITE_URL or site.url must be an absolute http(s) URL without a query or fragment: ${value}`,
    );
  }
  return url.href.replace(/\/+$/, '');
}

function normalizeBaseUrl(value?: string): string | undefined {
  const baseUrl = value?.replace(/\/+$/, '') || undefined;
  if (!baseUrl) return undefined;
  if (!baseUrl.startsWith('/') || baseUrl.startsWith('//') || /[?#]/.test(baseUrl)) {
    throw new Error(`BASE_URL must be a path beginning with "/": ${baseUrl}`);
  }
  return baseUrl;
}

/**
 * Get the base URL from BASE_URL or the pathname of the public site URL.
 *
 * @param session session with logging
 */
function getBaseUrl(session: ISession): string | undefined {
  const siteUrl = getSiteUrl(session);
  const inferredBaseUrl = siteUrl
    ? new URL(siteUrl).pathname.replace(/\/+$/, '') || undefined
    : undefined;
  const hasBaseUrl = process.env.BASE_URL !== undefined;
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL);
  if (hasBaseUrl && inferredBaseUrl !== undefined && baseUrl !== inferredBaseUrl) {
    throw new Error(`BASE_URL (${baseUrl ?? '/'}) conflicts with the path in ${siteUrl}`);
  }
  const resolvedBaseUrl = baseUrl ?? inferredBaseUrl;
  if (resolvedBaseUrl) {
    session.log.info(`Building the site with a baseurl of "${resolvedBaseUrl}"`);
  } else if (siteUrl) {
    session.log.info(`Building the site at "${siteUrl}"`);
  } else {
    session.log.info(
      'Building the base site.\nSet site.url (or SITE_URL) to configure public URLs, or BASE_URL for a path-only deployment prefix.',
    );
  }
  return resolvedBaseUrl;
}

export function warnIfMissingSiteUrl(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (process.env.SITE_URL || siteConfig?.url || process.env.READTHEDOCS_CANONICAL_URL) {
    return;
  }
  session.log.warn(
    'No site URL is configured. Generated sitemap.xml and robots.txt files will contain localhost URLs and are unsuitable for deployment. Set site.url in myst.yml or the SITE_URL environment variable.',
  );
}

/**
 * Build a MyST project as a static HTML deployment
 *
 * @param session session with logging
 * @param opts configuration options
 */
export async function buildHtml(session: ISession, opts: StartOptions) {
  const template = await getSiteTemplate(session, opts);
  warnIfMissingSiteUrl(session);
  // The BASE_URL env variable allows for mounting the site in a folder, e.g., github pages
  const baseurl = getBaseUrl(session);
  // Note, this process is really only for Remix templates
  // We could add a flag in the future for other templates
  const htmlDir = path.join(session.buildPath(), 'html');
  fs.rmSync(htmlDir, { recursive: true, force: true });
  fs.mkdirSync(htmlDir, { recursive: true });
  const appServer = await startServer(session, { ...opts, buildStatic: true, baseurl });
  if (!appServer) return;
  const host = `http://localhost:${appServer.port}`;
  const routes = await currentSiteRoutes(session, host, baseurl);

  // Fetch all HTML pages and assets by the template
  await Promise.all(
    routes.map(async (route) =>
      limitConnections(async () => {
        try {
          const resp = await fetchWithRetry(session, route.url);
          if (!resp.ok) {
            session.log.error(`Error fetching ${route.url}`);
            return;
          }
          if (route.binary && resp.body) {
            await new Promise<void>((resolve, reject) => {
              const filename = path.join(htmlDir, route.path);
              if (!fs.existsSync(filename))
                fs.mkdirSync(path.dirname(filename), { recursive: true });
              const fileWriteStream = fs.createWriteStream(filename);
              resp.body!.pipe(fileWriteStream);
              resp.body!.on('error', reject);
              fileWriteStream.on('error', reject);
              fileWriteStream.on('finish', resolve);
            });
          } else {
            const content = await resp.text();
            writeFileToFolder(path.join(htmlDir, route.path), content);
          }
        } catch (error) {
          if (!route.optional) throw error;
          session.log.warn(
            `Could not fetch optional asset ${route.url}: ${(error as Error).message}`,
          );
        }
      }),
    ),
  );
  await appServer.stop();

  // Copy the files for the template used.
  //
  // This always includes the thebe JS chunks, even when no project enables
  // `thebe`/`jupyter`. The myst-theme uses thebe-core to render Jupyter cell
  // outputs, so these chunks are required for outputs to render at all.
  const templateBuildDir = path.join(template.templatePath, 'public');
  fs.copySync(templateBuildDir, htmlDir);

  // Copy all of the static assets
  fs.copySync(session.publicPath(), path.join(htmlDir, 'build'));

  // Copy user static files to html build root
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  for (const proj of siteConfig?.projects ?? []) {
    if (!proj.path) continue;
    const projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), proj.path);
    copyStaticFiles(session, projectConfig?.static_files ?? [], htmlDir, proj.path);
  }
  fs.copySync(path.join(session.sitePath(), 'config.json'), path.join(htmlDir, 'config.json'));
  fs.copySync(path.join(session.sitePath(), 'public.json'), path.join(htmlDir, 'public.json'));
  fs.copySync(path.join(session.sitePath(), 'objects.inv'), path.join(htmlDir, 'objects.inv'));

  // NOTE: HTML static output needs to patch the contents, this is done on the fly by the server
  const xrefs = JSON.parse(
    fs.readFileSync(path.join(session.sitePath(), 'myst.xref.json')).toString(),
  ) as MystXRefs;
  xrefs.references?.forEach((ref) => {
    ref.data = ref.data?.replace(/^\/content/, '');
  });
  fs.writeFileSync(path.join(htmlDir, 'myst.xref.json'), JSON.stringify(xrefs));

  // Copy the search index
  fs.copySync(
    path.join(session.sitePath(), 'myst.search.json'),
    path.join(htmlDir, 'myst.search.json'),
  );

  // We need to go through and change all links to the right folder
  rewriteAssetsFolder(htmlDir, baseurl);

  // Explicitly close the process as the web server doesn't always stop?
  process.exit(0);
}
