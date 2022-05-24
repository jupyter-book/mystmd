import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import yaml from 'js-yaml';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { publicPath, serverPath } from './utils';
import { Options, SiteConfig, SiteFolder } from './types';
import { getFileName } from './webConfig';
import { DocumentCache, watchConfig } from './cache';
import { LocalProjectPage } from '../types';
import { selectors } from '../store';

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

async function processFolder(
  cache: DocumentCache,
  section: SiteConfig['site']['sections'][0],
  folder: SiteFolder,
): Promise<{ id: string; processed: boolean }[]> {
  const pages = [{ slug: folder.index }, ...folder.pages];
  const slugs = pages.filter(({ slug }) => slug) as { slug: string }[];
  const files = await Promise.all(
    slugs.map(async ({ slug }) => {
      const { filename } = getFileName(section.path, slug);
      const processed = await cache.processFile({
        folder: section.path,
        slug,
        filename,
      });
      return { id: `${section.folder}/${slug}`, processed };
    }),
  );
  return files;
}

// async function processFolder(
//   cache: DocumentCache,
//   siteProject: SiteProject,
//   project: Project,
// ): Promise<{ id: string; processed: boolean }[]> {
//   const pages = project.pages.filter((page) => 'slug' in page) as ProjectPage[];
//   const files = await Promise.all(
//     pages.map(async (page) => {
//       const processed = await cache.processFile(page);
//       return { id: `${section.folder}/${slug}`, processed };
//     }),
//   );
//   return files;
// }

// async function processConfig(
//   cache: DocumentCache,
//   store: Store<RootState>,
// ): Promise<{ id: string; processed: boolean }[]> {
//   cache.$startupPass = true;
//   const state = store.getState();
//   const siteConfig = selectors.selectLocalSiteConfig(state);
//   const folders = await Promise.all(
//     (siteConfig?.projects ?? []).map((sec) => {
//       const proj = selectors.selectLocalProject(state, sec.path);
//       if (!proj) return null;
//       return processFolder(cache, sec, folder);
//     }),
//   );
//   cache.$startupPass = false;
//   await cache.processAllLinks();
//   await cache.writeConfig();
//   return folders.flat().filter((f) => f) as { id: string; processed: boolean }[];
// }

export async function buildContent(session: ISession, opts: Options): Promise<DocumentCache> {
  const cache = new DocumentCache(session, opts);

  if (opts.force || opts.clean) {
    cleanBuiltFiles(session, opts);
  }
  ensureBuildFoldersExist(session, opts);

  // await cache.readConfig();
  // session.log.debug('Site Config:\n\n', yaml.dump(cache.config));

  const toc = tic();
  // Process all existing files
  // const pages = await processConfig(cache);

  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (!siteConfig?.projects.length) return cache;
  const project = selectors.selectLocalProject(
    session.store.getState(),
    siteConfig?.projects[0].path,
  );
  const pages = await Promise.all([
    cache.processFile2(project.file, siteConfig.projects[0].slug, project.index),
    ...project.pages
      .filter((page): page is LocalProjectPage => 'slug' in page)
      .map(async (page) => {
        console.log(page);
        console.log(siteConfig.projects[0]);
        return cache.processFile2(page.file, siteConfig.projects[0].slug, page.slug);
      }),
  ]);

  console.log(pages);
  const touched = pages.flat().filter(({ processed }) => processed).length;
  if (touched) {
    session.log.info(toc(`📚 Built ${touched} / ${pages.length} pages in %s.`));
  } else {
    session.log.info(toc(`📚 ${pages.length} pages loaded from cache in %s.`));
  }
  return cache;
}

export function watchContent(cache: DocumentCache) {
  const processor = (folder: string) => async (eventType: string, filename: string) => {
    cache.session.log.debug(`File modified: "${filename}" (${eventType})`);
    const base = path.basename(filename);
    if (base === '_toc.yml') {
      await cache.readConfig();
      await cache.writeConfig();
      return;
    }
    cache.markFileDirty(folder, base);
    await cache.process();
  };

  // Watch the full content folder
  try {
    // TODO: Change this to a singe watch
    cache.config?.site.sections.forEach(({ path: folderPath }) => {
      chokidar
        .watch(folderPath, {
          ignoreInitial: true,
          awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 50 },
        })
        .on('all', processor(folderPath));
    });
    // Watch the curvenote.yml
    watchConfig(cache);
  } catch (error) {
    cache.session.log.error((error as Error).message);
    cache.session.log.error(
      '🙈 The file-system watch failed.\n\tThe server should still work, but will require you to restart it manually to see any changes to content.\n\tUse `curvenote start -c` to clear cache and restart.',
    );
  }
}
