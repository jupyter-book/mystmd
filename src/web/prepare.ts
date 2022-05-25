import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import yaml from 'js-yaml';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { publicPath, serverPath } from './utils';
import { Options } from './types';
import { DocumentCache } from './cache';
import { LocalProjectPage } from '../types';
import { selectors } from '../store';
import { CURVENOTE_YML } from '../newconfig';
import { getSiteManifest, updateProject } from '../toc';

export function cleanBuiltFiles(session: ISession, opts: Options, info = true) {
  const toc = tic();
  fs.rmSync(path.join(serverPath(opts), 'app', 'content'), { recursive: true, force: true });
  fs.rmSync(path.join(publicPath(opts), '_static'), { recursive: true, force: true });
  const log = info ? session.log.info : session.log.debug;
  log(toc('🧹 Clean build files in %s.'));
}

export function ensureBuildFoldersExist(session: ISession, opts: Options) {
  session.log.debug('Build folders created for `app/content` and `_static`.');
  fs.mkdirSync(path.join(serverPath(opts), 'app', 'content'), { recursive: true });
  fs.mkdirSync(path.join(publicPath(opts), '_static'), { recursive: true });
}

export async function writeSiteManifest(session: ISession, opts: Options) {
  const configPath = path.join(serverPath(opts), 'app', 'config.json');
  session.log.info('⚙️  Writing config.json');
  const siteManifest = getSiteManifest(session);
  fs.writeFileSync(configPath, JSON.stringify(siteManifest));
}

export async function buildContent2(session: ISession, opts: Options): Promise<DocumentCache> {
  const cache = new DocumentCache(session, opts);

  if (opts.force || opts.clean) {
    cleanBuiltFiles(session, opts);
  }
  ensureBuildFoldersExist(session, opts);

  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  session.log.debug(`Site Config:\n\n${yaml.dump(siteConfig)}`);

  const toc = tic();

  if (!siteConfig?.projects.length) return cache;
  const siteProject = siteConfig.projects[0];
  updateProject(session.store, siteProject.path);
  const project = selectors.selectLocalProject(session.store.getState(), siteProject.path);
  if (!project) {
    session.log.error(`Could not find project config at ${siteProject.path}`);
    return cache;
  }
  // Load the citations first, or else they are loaded in each call below
  await cache.getCitationRenderer(siteProject.path);
  const pages = await Promise.all([
    cache.processFile2(siteProject, { file: project.file, slug: project.index }),
    ...project.pages
      .filter((page): page is LocalProjectPage => 'slug' in page)
      .map(async (page) => {
        return cache.processFile2(siteProject, page);
      }),
  ]);

  const touched = pages.flat().filter(({ processed }) => processed).length;
  if (touched) {
    session.log.info(toc(`📚 Built ${touched} / ${pages.length} pages in %s.`));
  } else {
    session.log.info(toc(`📚 ${pages.length} pages loaded from cache in %s.`));
  }
  await writeSiteManifest(session, opts);
  return cache;
}

export function watchContent(session: ISession) {
  const processor = () => async (eventType: string, filename: string) => {
    if (filename.startsWith('_build')) return;
    session.log.debug(`File modified: "${filename}" (${eventType})`);
    session.log.debug('Rebuilding everything 😱');
    await buildContent2(session, {});
  };

  // Watch the full content folder
  // try {
  //   // TODO: Change this to a singe watch
  //   cache.config?.site.sections.forEach(({ path: folderPath }) => {
  //     chokidar
  //       .watch(folderPath, {
  //         ignoreInitial: true,
  //         awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 50 },
  //       })
  //       .on('all', processor(folderPath));
  //   });
  //   // Watch the curvenote.yml
  //   watchConfig(cache);
  // } catch (error) {
  //   cache.session.log.error((error as Error).message);
  //   cache.session.log.error(
  //     '🙈 The file-system watch failed.\n\tThe server should still work, but will require you to restart it manually to see any changes to content.\n\tUse `curvenote start -c` to clear cache and restart.',
  //   );
  // }
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (!siteConfig) return;
  // This doesn't watch new projects if they are added to the content.
  siteConfig.projects.forEach((proj) => {
    fs.watch(proj.path, { recursive: true }, processor());
  });
  fs.watch(CURVENOTE_YML, {}, processor());
}
