import { ExportFormats } from 'myst-frontmatter';
import path from 'path';
import { findCurrentProjectAndLoad } from '../config';
import { filterPages, loadProjectFromDisk } from '../project';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { collectExportOptions } from './utils/collectExportOptions';
import { localArticleExport } from './utils/localArticleExport';

export type BuildOpts = {
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  file?: string;
  output?: string;
  checkLinks?: boolean;
  clean?: boolean;
  writeToc?: boolean;
};

export function getExportFormats(opts: BuildOpts) {
  const { docx, pdf, tex } = opts;
  const buildAll = !docx && !pdf && !tex;
  const formats = [];
  if (docx || buildAll) formats.push(ExportFormats.docx);
  if (pdf || buildAll) formats.push(ExportFormats.pdf);
  if (tex || buildAll) formats.push(ExportFormats.tex);
  return formats;
}

export async function build(session: ISession, opts: BuildOpts) {
  const formats = getExportFormats(opts);
  const { file, output, clean, writeToc } = opts;
  if (output && !file) {
    session.log.warn(
      'Ignoring --output value; this may only be used if --file option is also specified',
    );
  }
  const configPath = selectors.selectCurrentProjectPath(session.store.getState());
  let pages: string[];
  let projectPath: string | undefined;
  let noDefaultExport = false;
  if (file) {
    pages = [file];
    projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  } else {
    noDefaultExport = true;
    const project = loadProjectFromDisk(session, configPath ?? '.', { writeToc });
    pages = filterPages(project).map((page) => page.file);
    projectPath = configPath;
  }
  const exportOptionsList = await collectExportOptions(session, pages, formats, {
    filename: output,
    clean,
    noDefaultExport,
    projectPath,
  });
  await localArticleExport(session, exportOptionsList, { clean, projectPath });
}
