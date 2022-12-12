import path from 'path';
import { ExportFormats } from 'myst-frontmatter';
import { filterPages, loadProjectFromDisk } from '../project';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { collectExportOptions, localArticleExport } from './utils';
import { buildSite } from './site/prepare';
import type { ExportWithInputOutput } from './types';

export type BuildOpts = {
  site?: boolean;
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  force?: boolean;
  checkLinks?: boolean;
};

export function getExportFormats(opts: BuildOpts) {
  const { docx, pdf, tex, force, site } = opts;
  const buildAll = !force && !docx && !pdf && !tex && !site;
  const formats = [];
  if (docx || buildAll) formats.push(ExportFormats.docx);
  if (pdf || buildAll) formats.push(ExportFormats.pdf);
  if (tex || buildAll) formats.push(ExportFormats.tex);
  return formats;
}

export function exportSite(session: ISession, opts: BuildOpts) {
  const { docx, pdf, tex, force, site } = opts;
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  return site || (siteConfig && !force && !docx && !pdf && !tex && !site);
}

export function getProjectPaths(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const projectPaths: string[] = [
    selectors.selectCurrentProjectPath(session.store.getState()) ?? path.resolve('.'),
    ...(siteConfig?.projects
      ?.map((proj) => proj.path)
      .filter((projectPath): projectPath is string => !!projectPath) ?? []),
  ];
  return projectPaths;
}

export async function collectAllBuildExportOptions(
  session: ISession,
  files: string[],
  opts: BuildOpts,
) {
  const { force } = opts;
  const formats = getExportFormats(opts);
  let exportOptionsList: ExportWithInputOutput[];
  if (files.length) {
    exportOptionsList = await collectExportOptions(session, files, formats, {
      force,
    });
  } else {
    const projectPaths = getProjectPaths(session);
    exportOptionsList = (
      await Promise.all(
        projectPaths.map(async (projectPath) => {
          try {
            const project = await loadProjectFromDisk(session, projectPath);
            files = filterPages(project).map((page) => page.file);
          } catch (err) {
            session.log.debug(`Unable to load any content from project at: ${projectPath}\n${err}`);
            return [];
          }
          const exportOptions = await collectExportOptions(session, files, formats, {
            force,
            projectPath,
          });
          return exportOptions;
        }),
      )
    ).flat();
  }
  return exportOptionsList;
}

export async function build(session: ISession, files: string[], opts: BuildOpts) {
  const { site } = opts;
  const performSiteBuild = files.length === 0 && exportSite(session, opts);
  const exportOptionsList = await collectAllBuildExportOptions(session, files, opts);
  const exportLogList = exportOptionsList.map((exportOptions) => {
    return `${path.relative('.', exportOptions.$file)} -> ${exportOptions.output}`;
  });
  if (exportLogList.length === 0) {
    if (!site) {
      session.log.info('📭 No file exports found.');
      session.log.debug(
        `You may need to add an 'exports' field to the frontmatter of the file(s) you wish to export:\n\n---\nexports:\n  - format: tex\n---`,
      );
    }
  } else {
    session.log.info(`📬 Performing exports:\n   ${exportLogList.join('\n   ')}`);
    await localArticleExport(session, exportOptionsList, {});
  }
  if (!performSiteBuild) return;
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig) {
    session.log.info('🌎 No site configuration found.');
    session.log.debug(`To build a site, first run 'myst init --site'`);
  } else {
    session.log.info(`🌎 Building MyST site`);
    await buildSite(session, opts);
  }
}
