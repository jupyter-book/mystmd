import path from 'path';
import inquirer from 'inquirer';
import { ExportFormats } from 'myst-frontmatter';
import { promptContinue } from '../cli/options';
import { filterPages, loadProjectFromDisk } from '../project';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { collectExportOptions, localArticleExport } from './utils';

export type BuildOpts = {
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  force?: boolean;
  checkLinks?: boolean;
  yes?: boolean;
};

export function getExportFormats(opts: BuildOpts) {
  const { docx, pdf, tex, force } = opts;
  const buildAll = !force && !docx && !pdf && !tex;
  const formats = [];
  if (docx || buildAll) formats.push(ExportFormats.docx);
  if (pdf || buildAll) formats.push(ExportFormats.pdf);
  if (tex || buildAll) formats.push(ExportFormats.tex);
  return formats;
}

export async function build(session: ISession, files: string[], opts: BuildOpts) {
  const { force, yes } = opts;
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
    session.log.warn(
      `📭 No exports found. You may need to add an 'exports' field to the frontmatter of the file(s) you wish to export:\n\n---\nexports:\n  - format: tex\n---`,
    );
    return;
  }
  session.log.info(`📬 Performing exports:\n   ${exportLogList.join('\n   ')}`);
  const cont = yes || (await inquirer.prompt([promptContinue()])).cont;
  if (cont) {
    await localArticleExport(session, exportOptionsList, { projectPath });
  }
}
