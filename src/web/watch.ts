import { join } from 'path';
import chokidar from 'chokidar';
import { ISession } from '../session/types';
import { selectors } from '../store';
import { CURVENOTE_YML } from '../newconfig';
import { changeFile, fastProcessFile, processSite } from '../store/local/actions';
import { selectPageSlug } from '../store/selectors';
import { SiteProject } from '../types';

function watchConfig(session: ISession) {
  return chokidar
    .watch(CURVENOTE_YML, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    .on('all', async (eventType: string, filename: string) => {
      session.log.debug(`File modified: "${filename}" (${eventType})`);
      await processSite(session, true);
    });
}
function fileProcessor(session: ISession, siteProject: SiteProject) {
  return async (eventType: string, file: string) => {
    if (file.startsWith('_build') || file.startsWith('.')) return;
    changeFile(session, file, eventType);
    const pageSlug = selectPageSlug(session.store.getState(), siteProject.path, file);
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
    // TODO: process full site
    // await processSite(session, true);
  };
}

export function watchContent(session: ISession) {
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (!siteConfig) return;
  // For each project watch the full content folder
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
        ignored: ['_build/**', '.git/**', ...ignored],
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      })
      .on('all', fileProcessor(session, proj));
  });
  // Watch the curvenote.yml
  watchConfig(session);
}
