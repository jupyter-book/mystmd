import path from 'path';
import chalk from 'chalk';
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
  all?: boolean;
  force?: boolean;
  checkLinks?: boolean;
};

export function getExportFormats(opts: BuildOpts & { explicit?: boolean }) {
  const { docx, pdf, tex, all, explicit } = opts;
  const formats = [];
  const any = docx || pdf || tex;
  const override = all || (!any && explicit);
  if (docx || override) formats.push(ExportFormats.docx);
  if (pdf || override) formats.push(ExportFormats.pdf);
  if (tex || override) formats.push(ExportFormats.tex);
  return formats;
}

export function exportSite(session: ISession, opts: BuildOpts) {
  const { docx, pdf, tex, force, site, all } = opts;
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  return site || all || (siteConfig && !force && !docx && !pdf && !tex && !site);
}

function uniqueArray<T = any>(array: T[]): T[] {
  return array.filter((v, i, a) => a.indexOf(v) === i);
}

export function getProjectPaths(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const projectPaths: string[] = [
    selectors.selectCurrentProjectPath(session.store.getState()) ?? path.resolve('.'),
    ...(siteConfig?.projects
      ?.map((proj) => proj.path)
      .filter((projectPath): projectPath is string => !!projectPath) ?? []),
  ];
  return uniqueArray(projectPaths);
}

export async function collectAllBuildExportOptions(
  session: ISession,
  files: string[],
  opts: BuildOpts,
) {
  const { force } = opts;
  const formats = getExportFormats({ ...opts, explicit: files.length > 0 });
  session.log.debug(`Exporting formats: "${formats.join('", "')}"`);
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
  const { site, all } = opts;
  const performSiteBuild = all || (files.length === 0 && exportSite(session, opts));
  const exportOptionsList = await collectAllBuildExportOptions(session, files, opts);
  const exportLogList = exportOptionsList.map((exportOptions) => {
    return `${path.relative('.', exportOptions.$file)} -> ${exportOptions.output}`;
  });
  if (exportLogList.length === 0) {
    if (!(site || performSiteBuild)) {
      // Print out the kinds that are filtered
      const kinds = Object.entries(opts)
        .filter(([k, v]) => k !== 'force' && k !== 'checkLinks' && k !== 'site' && v)
        .map(([k]) => k);
      session.log.info(
        `📭 No file exports${kinds.length > 0 ? ` with kind "${kinds.join('", "')}"` : ''} found.`,
      );
      session.log.info(
        chalk.dim(
          `You may need to add an 'exports' field to the frontmatter of the file(s) you wish to export:\n\n---\nexports:\n  - format: ${kinds[0]}\n---`,
        ),
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
