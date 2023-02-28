import chokidar from 'chokidar';
import { join, extname, basename } from 'path';
import type { SiteProject } from 'myst-config';
import type { LinkTransformer } from 'myst-transforms';
import type { ISession } from '../../session/types';
import { changeFile, fastProcessFile, processSite } from '../../process/site';
import type { TransformFn } from '../../process';
import { selectors, watch } from '../../store';
import { KNOWN_FAST_BUILDS } from '../../utils/resolveExtension';

// TODO: allow this to work from other paths

type TransformOptions = {
  extraLinkTransformers?: LinkTransformer[];
  extraTransforms?: TransformFn[];
  defaultTemplate?: string;
};

function watchConfigAndPublic(session: ISession, serverReload: () => void, opts: TransformOptions) {
  const watchFiles = ['public'];
  const siteConfigFile = selectors.selectCurrentSiteFile(session.store.getState());
  if (siteConfigFile) watchFiles.push(siteConfigFile);
  return chokidar
    .watch(watchFiles, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    .on('all', async (eventType: string, filename: string) => {
      if (selectors.selectReloadingState(session.store.getState())) {
        return;
      }
      session.store.dispatch(watch.actions.markReloading({ reloading: true }));
      session.log.debug(`File modified: "${filename}" (${eventType})`);
      session.log.info('💥 Triggered full site rebuild');
      await processSite(session, opts);
      serverReload();
      session.store.dispatch(watch.actions.markReloading({ reloading: false }));
    });
}

function triggerProjectReload(file: string, eventType: string) {
  // Reload project if toc changes
  if (basename(file) === '_toc.yml') return true;
  // Reload project if file is added or remvoed
  if (['add', 'unlink'].includes(eventType)) return true;
  // Otherwise do not reload project
  return false;
}

function fileProcessor(
  session: ISession,
  siteProject: SiteProject,
  serverReload: () => void,
  opts: TransformOptions,
) {
  return async (eventType: string, file: string) => {
    if (selectors.selectReloadingState(session.store.getState())) {
      return;
    }
    session.store.dispatch(watch.actions.markReloading({ reloading: true }));
    if (file.startsWith('_build') || file.startsWith('.') || file.includes('.ipynb_checkpoints')) {
      session.log.debug(`Ignoring build trigger for ${file} with eventType of "${eventType}"`);
      return;
    }
    changeFile(session, file, eventType);
    if (KNOWN_FAST_BUILDS.has(extname(file)) && eventType === 'unlink') {
      session.log.info(`🚮 File ${file} deleted...`);
    }
    if (!KNOWN_FAST_BUILDS.has(extname(file)) || ['add', 'unlink'].includes(eventType)) {
      let reloadProject = false;
      if (triggerProjectReload(file, eventType)) {
        session.log.info('💥 Triggered full project load and site rebuild');
        reloadProject = true;
      } else {
        session.log.info('💥 Triggered full site rebuild');
      }
      await processSite(session, { reloadProject, ...opts });
      serverReload();
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
      ...opts,
    });
    serverReload();
    // TODO: process full site silently and update if there are any
    // await processSite(session, true);
    session.store.dispatch(watch.actions.markReloading({ reloading: false }));
  };
}

export function watchContent(session: ISession, serverReload: () => void, opts: TransformOptions) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig?.projects) return;

  const siteConfigFile = selectors.selectCurrentSiteFile(session.store.getState());
  const localProjects = siteConfig.projects.filter(
    (proj): proj is { slug: string; path: string } => {
      return Boolean(proj.path);
    },
  );
  // For each project watch the full content folder
  localProjects.forEach((proj) => {
    const ignored =
      proj.path === '.'
        ? localProjects.filter(({ path }) => path !== '.').map(({ path }) => join(path, '*'))
        : [];
    if (siteConfigFile) ignored.push(siteConfigFile);
    chokidar
      .watch(proj.path, {
        ignoreInitial: true,
        ignored: ['public', '**/_build/**', '**/.git/**', ...ignored],
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      })
      .on('all', fileProcessor(session, proj, serverReload, opts));
  });
  // Watch the myst.yml
  watchConfigAndPublic(session, serverReload, opts);
}
