import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ISession } from '../../session/types';
import { tic } from '../utils/exec';
import { serverPath } from './utils';
import { Options, SiteConfig, SiteFolder } from './types';
import { getFileName, watchConfig, writeConfig } from './webConfig';
import { DocumentCache } from './cache';

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
        folder: section.folder,
        slug,
        filename,
      });
      return { id: `${section.folder}/${slug}`, processed };
    }),
  );
  return files;
}

async function processConfig(cache: DocumentCache): Promise<{ id: string; processed: boolean }[]> {
  cache.$processLinks = false;
  const folders = await Promise.all(
    (cache.config?.site.sections ?? []).map((sec) => {
      const folder = cache.config?.folders[sec.folder];
      if (!folder) return null;
      return processFolder(cache, sec, folder);
    }),
  );
  cache.$processLinks = true;
  await cache.processAllLinks();
  return folders.flat().filter((f) => f) as { id: string; processed: boolean }[];
}

export async function watchContent(session: ISession, opts: Options) {
  const cache = new DocumentCache(session, opts);

  if (opts.force || opts.clean) {
    session.log.info('🧹  Cleaning built files.');
    fs.rmdirSync(path.join(serverPath(opts), 'app', 'content'), { recursive: true });
    fs.rmdirSync(path.join(serverPath(opts), 'public', 'images'), { recursive: true });
  }

  cache.config = await writeConfig(session, opts);
  session.log.debug('Site Config:\n\n', yaml.dump(cache.config));

  const processor = async (eventType: string, filename: string) => {
    session.log.debug(`File modified: "${filename}" (${eventType})`);
    const base = path.basename(filename);
    if (base === '_toc.yml') {
      cache.config = await writeConfig(session, opts, false);
      return;
    }
    cache.markFileDirty(path.dirname(filename), base);
    await cache.process();
  };

  const toc = tic();
  // Process all existing files
  const pages = await processConfig(cache);
  const touched = pages.filter(({ processed }) => processed).length;
  session.log.info(toc(`📚 Built ${touched} / ${pages.length} pages in %s.`));
  // Watch the full content folder
  fs.watch('content', { recursive: true }, processor);
  // Watch the curvenote.yml
  watchConfig(session, opts);
}
