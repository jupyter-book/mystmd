import chokidar from 'chokidar';
import { join, extname } from 'path';
import type { SiteProject } from 'myst-config';
import type { LinkTransformer } from 'myst-transforms';
import type { ISession } from '../../session/types';
import { changeFile, fastProcessFile, processSite } from '../../process/site';
import type { TransformFn } from '../../process';
import { selectors } from '../../store';

// TODO: allow this to work from other paths

type TransformOptions = {
  extraLinkTransformers?: LinkTransformer[];
  extraTransforms?: TransformFn[];
  defaultTemplate?: string;
};

function watchConfigAndPublic(
  session: ISession,
  triggerReload: () => void,
  opts: TransformOptions,
) {
  const watchFiles = ['public'];
  const siteConfigFile = selectors.selectCurrentSiteFile(session.store.getState());
  if (siteConfigFile) watchFiles.push(siteConfigFile);
  return chokidar
    .watch(watchFiles, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    .on('all', async (eventType: string, filename: string) => {
      session.log.debug(`File modified: "${filename}" (${eventType})`);
      session.log.info('💥 Triggered full site rebuild');
      await processSite(session, opts);
      triggerReload();
    });
}

const KNOWN_FAST_BUILDS = new Set(['.ipynb', '.md']);

function fileProcessor(
  session: ISession,
  siteProject: SiteProject,
  triggerReload: () => void,
  opts: TransformOptions,
) {
  return async (eventType: string, file: string) => {
    if (file.startsWith('_build') || file.startsWith('.')) return;
    changeFile(session, file, eventType);
    if (!KNOWN_FAST_BUILDS.has(extname(file))) {
      session.log.info('💥 Triggered full site rebuild');
      await processSite(session, opts);
      triggerReload();
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
    triggerReload();
    // TODO: process full site silently and update if there are any
    // await processSite(session, true);
  };
}

export function watchContent(session: ISession, triggerReload: () => void, opts: TransformOptions) {
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
      .on('all', fileProcessor(session, proj, triggerReload, opts));
  });
  // Watch the myst.yml
  watchConfigAndPublic(session, triggerReload, opts);
}
