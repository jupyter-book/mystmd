import fs from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { publicPath, serverPath } from './utils';
import { Options } from './types';
import { DocumentCache } from './cache';
import { LocalProjectPage, SiteProject } from '../types';
import { selectors } from '../store';
import { getSiteManifest, loadProjectFromDisk } from '../toc';
import {
  combineProjectCitationRenderers,
  loadFile,
  transformMdast,
  writeFile,
} from '../store/local/actions';

export function cleanBuiltFiles(session: ISession, info = true) {
  const toc = tic();
  fs.rmSync(join(serverPath(session), 'app', 'content'), { recursive: true, force: true });
  fs.rmSync(join(publicPath(session), '_static'), { recursive: true, force: true });
  const log = info ? session.log.info : session.log.debug;
  log(toc('🧹 Clean build files in %s.'));
}

export function ensureBuildFoldersExist(session: ISession) {
  session.log.debug('Build folders created for `app/content` and `_static`.');
  fs.mkdirSync(join(serverPath(session), 'app', 'content'), { recursive: true });
  fs.mkdirSync(join(publicPath(session), '_static'), { recursive: true });
}

export async function processProject(cache: DocumentCache, siteProject: SiteProject) {
  const toc = tic();
  const { store, log } = cache.session;
  const project = loadProjectFromDisk(cache.session, siteProject.path);
  // Load the citations first, or else they are loaded in each call below
  const projectPages = [
    { file: project.file, slug: project.index },
    ...project.pages.filter((page): page is LocalProjectPage => 'file' in page),
  ];
  await Promise.all([
    ...projectPages.map((page) => loadFile(cache.session, page.file)),
    ...project.citations.map((path) => loadFile(cache.session, path)),
  ]);
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(cache.session, siteProject.path);
  const fakeProjectPages = projectPages.filter((p) => p.file.endsWith('.md'));
  await Promise.all(
    fakeProjectPages.map((page) =>
      transformMdast(cache.session, { projectPath: project.path, file: page.file }),
    ),
  );
  await Promise.all(
    fakeProjectPages.map((page) =>
      writeFile(cache.session, {
        file: page.file,
        projectSlug: siteProject.slug,
        pageSlug: page.slug,
      }),
    ),
  );
  // const touched = pages.flat().filter(({ processed }) => processed).length;
  // if (touched) {
  //   log.info(toc(`📚 Built ${touched} / ${pages.length} pages for ${siteProject.slug} in %s.`));
  // } else {
  //   log.info(toc(`📚 ${pages.length} pages loaded from cache for ${siteProject.slug} in %s.`));
  // }
  // return {
  //   pages,
  //   touched,
  // };
}

export async function writeSiteManifest(session: ISession) {
  const configPath = join(serverPath(session), 'app', 'config.json');
  session.log.info('⚙️  Writing site config.json');
  const siteManifest = getSiteManifest(session);
  fs.writeFileSync(configPath, JSON.stringify(siteManifest));
}

export async function buildSite(session: ISession, opts: Options): Promise<DocumentCache> {
  const cache = new DocumentCache(session, opts);

  if (opts.force || opts.clean) {
    cleanBuiltFiles(session);
  }
  ensureBuildFoldersExist(session);

  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  session.log.debug(`Site Config:\n\n${yaml.dump(siteConfig)}`);

  if (!siteConfig?.projects.length) return cache;
  await Promise.all(siteConfig.projects.map((siteProject) => processProject(cache, siteProject)));
  await writeSiteManifest(session);
  return cache;
}
