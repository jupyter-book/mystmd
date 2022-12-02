import path from 'path';
import inquirer from 'inquirer';
import { ExportFormats } from 'myst-frontmatter';
import { promptContinue } from '../cli/options';
import { filterPages, loadProjectFromDisk } from '../project';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { collectExportOptions, localArticleExport } from './utils';
import { buildSite } from './site/prepare';

export type BuildOpts = {
  site?: boolean;
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  force?: boolean;
  checkLinks?: boolean;
  yes?: boolean;
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

export async function build(session: ISession, files: string[], opts: BuildOpts) {
  const { force, yes, site } = opts;
  const formats = getExportFormats(opts);
  let projectPath: string | undefined;
  if (files.length === 0) {
    const configPath = selectors.selectCurrentProjectPath(session.store.getState());
    const project = loadProjectFromDisk(session, configPath ?? '.');
    files = filterPages(project).map((page) => page.file);
    projectPath = configPath;
  }
  const exportOptionsList = await collectExportOptions(session, files, formats, {
    force,
    projectPath,
  });
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
    const cont = yes || (await inquirer.prompt([promptContinue()])).cont;
    if (cont) {
      await localArticleExport(session, exportOptionsList, { projectPath });
    }
  }
  if (!exportSite(session, opts)) return;
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig) {
    session.log.info('🌎 No site configuration found.');
    session.log.debug(`To build a site, first run 'myst init --site'`);
  } else {
    await buildSite(session, opts);
  }
}
