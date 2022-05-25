import { join } from 'path';
import chokidar from 'chokidar';
import { ISession } from '../session/types';
import { IDocumentCache } from './types';
import { selectors } from '../store';
import { CURVENOTE_YML } from '../newconfig';
import { changeFile } from '../store/local/actions';

export function watchConfig(cache: IDocumentCache) {
  return chokidar
    .watch(CURVENOTE_YML, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    .on('all', async (eventType: string, filename: string) => {
      cache.session.log.debug(`File modified: "${CURVENOTE_YML}" (${eventType})`);
      // await cache.readConfig();
      // await cache.writeConfig();
      // await buildSite(cache.session, {});
    });
}

export function watchContent(session: ISession, cache: IDocumentCache) {
  const processor = async (eventType: string, filename: string) => {
    if (filename.startsWith('_build')) return;
    session.log.debug(`File modified: "${filename}" (${eventType})`);
    changeFile(session, filename, eventType);
    // await buildSite(session, {});
  };
  // TODO: watch the project folders
  chokidar
    .watch('.', {
      ignoreInitial: true,
      ignored: ['_build'],
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    .on('all', processor);

  // const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  // if (!siteConfig) return;
  // // Watch each project the full content folder
  // siteConfig.projects.forEach((proj) => {
  //   const ignored =
  //     proj.path === '.'
  //       ? [
  //           // If in the root, ignore the YML and all other projects
  //           CURVENOTE_YML,
  //           ...siteConfig.projects
  //             .filter(({ path }) => path !== '.')
  //             .map(({ path }) => join(path, '*')),
  //         ]
  //       : [];
  //   chokidar
  //     .watch(proj.path, {
  //       ignoreInitial: true,
  //       ignored: ['_build', ...ignored],
  //       awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  //     })
  //     .on('all', processor(proj.path));
  // });
  // // Watch the curvenote.yml
  // watchConfig(cache);
}
