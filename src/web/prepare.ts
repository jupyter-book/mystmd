import fs from 'fs';
import { join } from 'path';
import chokidar from 'chokidar';
import yaml from 'js-yaml';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { publicPath, serverPath } from './utils';
import { IDocumentCache, Options } from './types';
import { DocumentCache } from './cache';
import { LocalProjectPage, SiteProject } from '../types';
import { selectors } from '../store';
import { CURVENOTE_YML } from '../newconfig';
import { getSiteManifest, loadProjectFromDisk } from '../toc';

export function cleanBuiltFiles(session: ISession, opts: Options, info = true) {
  const toc = tic();
  fs.rmSync(join(serverPath(opts), 'app', 'content'), { recursive: true, force: true });
  fs.rmSync(join(publicPath(opts), '_static'), { recursive: true, force: true });
  const log = info ? session.log.info : session.log.debug;
  log(toc('🧹 Clean build files in %s.'));
}

export function ensureBuildFoldersExist(session: ISession, opts: Options) {
  session.log.debug('Build folders created for `app/content` and `_static`.');
  fs.mkdirSync(join(serverPath(opts), 'app', 'content'), { recursive: true });
  fs.mkdirSync(join(publicPath(opts), '_static'), { recursive: true });
}

export async function buildProject(cache: DocumentCache, siteProject: SiteProject) {
  const toc = tic();
  const { store, log } = cache.session;
  const project = loadProjectFromDisk(store, siteProject.path);
  // Load the citations first, or else they are loaded in each call below
  await cache.getCitationRenderer(siteProject.path);
  const pages = await Promise.all([
    cache.processFile(siteProject, { file: project.file, slug: project.index }),
    ...project.pages
      .filter((page): page is LocalProjectPage => 'slug' in page)
      .map((page) => cache.processFile(siteProject, page)),
  ]);
  const touched = pages.flat().filter(({ processed }) => processed).length;
  if (touched) {
    log.info(toc(`📚 Built ${touched} / ${pages.length} pages for ${siteProject.slug} in %s.`));
  } else {
    log.info(toc(`📚 ${pages.length} pages loaded from cache for ${siteProject.slug} in %s.`));
  }
  return {
    pages,
    touched,
  };
}

export async function writeSiteManifest(session: ISession, opts: Options) {
  const configPath = join(serverPath(opts), 'app', 'config.json');
  session.log.info('⚙️  Writing site config.json');
  const siteManifest = getSiteManifest(session);
  fs.writeFileSync(configPath, JSON.stringify(siteManifest));
}

export async function buildSite(session: ISession, opts: Options): Promise<DocumentCache> {
  const cache = new DocumentCache(session, opts);

  if (opts.force || opts.clean) {
    cleanBuiltFiles(session, opts);
  }
  ensureBuildFoldersExist(session, opts);

  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  session.log.debug(`Site Config:\n\n${yaml.dump(siteConfig)}`);

  if (!siteConfig?.projects.length) return cache;
  await Promise.all(siteConfig.projects.map((siteProject) => buildProject(cache, siteProject)));
  await writeSiteManifest(session, opts);
  return cache;
}

export function watchConfig(cache: IDocumentCache) {
  return chokidar
    .watch(CURVENOTE_YML, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    .on('all', async (eventType: string) => {
      cache.session.log.debug(`File modified: "${CURVENOTE_YML}" (${eventType})`);
      // await cache.readConfig();
      // await cache.writeConfig();
      await buildSite(cache.session, {});
    });
}

export function watchContent(session: ISession, cache: IDocumentCache) {
  const processor = (path: string) => async (eventType: string, filename: string) => {
    if (filename.startsWith('_build')) return;
    session.log.debug(`File modified: "${join(path, filename)}" (${eventType})`);
    await buildSite(session, {});
  };

  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (!siteConfig) return;
  // Watch each project the full content folder
  siteConfig.projects.forEach((proj) => {
    const ignored =
      proj.path === '.'
        ? [
            // If in the root, ignore the YML and all other projects
            CURVENOTE_YML,
            ...siteConfig.projects
              .filter(({ path }) => path !== '.')
              .map(({ path }) => join(path, '*')),
          ]
        : [];
    chokidar
      .watch(proj.path, {
        ignoreInitial: true,
        ignored: ['_build', ...ignored],
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      })
      .on('all', processor(proj.path));
  });
  // Watch the curvenote.yml
  watchConfig(cache);
}
