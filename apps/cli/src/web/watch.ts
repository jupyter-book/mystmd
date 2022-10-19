import chokidar from 'chokidar';
import { join, extname } from 'path';
import { selectors } from 'myst-cli';
import type { SiteProject } from 'myst-config';
import type { ISession } from '../session/types';
import { changeFile, fastProcessFile, processSite } from '../store/local/actions';
import { BUILD_FOLDER } from '../utils';

// TODO: watch the actual configs based on session...
const CURVENOTE_YML = 'curvenote.yml';

function watchConfigAndPublic(session: ISession) {
  return chokidar
    .watch([CURVENOTE_YML, 'public'], {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    .on('all', async (eventType: string, filename: string) => {
      session.log.debug(`File modified: "${filename}" (${eventType})`);
      session.log.info('💥 Triggered full site rebuild');
      await processSite(session, { reloadConfigs: true });
    });
}

const KNOWN_FAST_BUILDS = new Set(['.ipynb', '.md']);

function fileProcessor(session: ISession, siteProject: SiteProject) {
  return async (eventType: string, file: string) => {
    if (file.startsWith(BUILD_FOLDER) || file.startsWith('.')) return;
    changeFile(session, file, eventType);
    if (!KNOWN_FAST_BUILDS.has(extname(file))) {
      session.log.info('💥 Triggered full site rebuild');
      await processSite(session, { reloadConfigs: true });
      return;
    }
    if (!siteProject.path) {
      session.log.warn(`⚠️ No local project path for file: ${file}`);
      return;
    }
    const pageSlug = selectors.selectPageSlug(session.store.getState(), siteProject.path, file);
    if (!pageSlug) {
      session.log.warn(`⚠️ File is not in project: ${file}`);
      return;
    }
    await fastProcessFile(session, {
      file,
      projectPath: siteProject.path,
      projectSlug: siteProject.slug,
      pageSlug,
    });
    // TODO: process full site silently and update if there are any
    // await processSite(session, true);
  };
}

export function watchContent(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig?.projects) return;
  const localProjects = siteConfig.projects.filter(
    (proj): proj is { slug: string; path: string } => {
      return Boolean(proj.path);
    },
  );
  // For each project watch the full content folder
  localProjects.forEach((proj) => {
    const ignored =
      proj.path === '.'
        ? [
            // If in the root, ignore the YML and all other projects
            CURVENOTE_YML,
            ...localProjects.filter(({ path }) => path !== '.').map(({ path }) => join(path, '*')),
          ]
        : [];
    chokidar
      .watch(proj.path, {
        ignoreInitial: true,
        ignored: ['public', '_build/**', '.git/**', ...ignored],
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      })
      .on('all', fileProcessor(session, proj));
  });
  // Watch the curvenote.yml
  watchConfigAndPublic(session);
}
