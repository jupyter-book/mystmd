import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { findCurrentProjectAndLoad } from '../config';
import { filterPages, loadProjectFromDisk } from '../project';
import { selectors } from '../store';
import type { ISession } from '../session';
import { getExportFormats } from './build';
import { collectExportOptions } from './utils';
import { ExportFormats } from 'myst-frontmatter';
import { getLogOutputFolder, getTexOutputFolder } from './pdf/create';
import { promptContinue } from '../cli/options';

export type CleanOptions = {
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  temp?: boolean;
  exports?: boolean;
  yes?: boolean;
};

export async function clean(session: ISession, files: string[], opts: CleanOptions) {
  const { temp, exports, yes } = opts;
  const formats = getExportFormats(opts);
  let projectPath: string | undefined;
  if (files.length === 0) {
    const configPath = selectors.selectCurrentProjectPath(session.store.getState());
    const project = loadProjectFromDisk(session, configPath ?? '.');
    files = filterPages(project).map((page) => page.file);
    projectPath = configPath;
  }
  const exportOptionsList = await collectExportOptions(session, files, formats, {
    projectPath,
  });
  let pathsToDelete: string[] = [];
  exportOptionsList.forEach((exportOptions) => {
    pathsToDelete.push(exportOptions.output);
    if (exportOptions.format === ExportFormats.pdftex) {
      pathsToDelete.push(getLogOutputFolder(exportOptions.output));
      pathsToDelete.push(getTexOutputFolder(exportOptions.output));
    }
  });
  if (temp || exports) {
    const projectPaths = projectPath
      ? [projectPath]
      : await Promise.all(
          files.map(async (file) => await findCurrentProjectAndLoad(session, path.dirname(file))),
        );
    projectPaths
      .filter((projPath): projPath is string => Boolean(projPath))
      .forEach((projPath) => {
        const buildPath = path.join(projPath, '_build');
        if (temp) pathsToDelete.push(path.join(buildPath, 'temp'));
        if (exports) pathsToDelete.push(path.join(buildPath, 'exports'));
      });
    if (temp) pathsToDelete.push(path.join(session.buildPath(), 'temp'));
    if (exports) pathsToDelete.push(path.join(session.buildPath(), 'exports'));
  }
  pathsToDelete = [...new Set(pathsToDelete)].sort();
  if (pathsToDelete.length === 0) {
    session.log.warn(`🗑 No build artifacts found to clean!`);
    return;
  }
  session.log.info(`❌ Deleting all the following paths:\n   ${pathsToDelete.join('\n   ')}`);
  const cont = yes || (await inquirer.prompt([promptContinue()])).cont;
  if (cont) {
    pathsToDelete.forEach((pathToDelete) => {
      fs.rmSync(pathToDelete, { recursive: true, force: true });
      session.log.info(`🗑 Deleting: ${pathToDelete}`);
    });
  }
}
