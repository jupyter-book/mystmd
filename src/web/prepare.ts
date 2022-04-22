import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { publicPath, serverPath } from './utils';
import { Options, SiteConfig, SiteFolder } from './types';
import { getFileName } from './webConfig';
import { DocumentCache, watchConfig } from './cache';

export function cleanBuiltFiles(session: ISession, opts: Options, info = true) {
  const toc = tic();
  fs.rmdirSync(path.join(serverPath(opts), 'app', 'content'), { recursive: true });
  fs.rmdirSync(path.join(publicPath(opts), '_static'), { recursive: true });
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

async function processConfig(cache: DocumentCache): Promise<{ id: string; processed: boolean }[]> {
  cache.$startupPass = true;
  const folders = await Promise.all(
    (cache.config?.site.sections ?? []).map((sec) => {
      const folder = cache.config?.folders[sec.folder];
      if (!folder) return null;
      return processFolder(cache, sec, folder);
    }),
  );
  cache.$startupPass = false;
  await cache.processAllLinks();
  await cache.writeConfig();
  return folders.flat().filter((f) => f) as { id: string; processed: boolean }[];
}

export async function buildContent(session: ISession, opts: Options): Promise<DocumentCache> {
  const cache = new DocumentCache(session, opts);

  if (opts.force || opts.clean) {
    cleanBuiltFiles(session, opts);
  }
  ensureBuildFoldersExist(session, opts);

  await cache.readConfig();
  session.log.debug('Site Config:\n\n', yaml.dump(cache.config));

  const toc = tic();
  // Process all existing files
  const pages = await processConfig(cache);
  const touched = pages.filter(({ processed }) => processed).length;
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
  cache.config?.site.sections.forEach(({ path: folderPath }) => {
    fs.watch(folderPath, { recursive: true }, processor(folderPath));
  });
  // Watch the curvenote.yml
  watchConfig(cache);
}
