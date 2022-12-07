import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { ExportFormats } from 'myst-frontmatter';
import { promptContinue } from '../cli/options';
import type { ISession } from '../session';
import { collectAllBuildExportOptions, getProjectPaths } from './build';
import { getLogOutputFolder, getTexOutputFolder } from './pdf/create';

export type CleanOptions = {
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  site?: boolean;
  temp?: boolean;
  exports?: boolean;
  templates?: boolean;
  all?: boolean;
  yes?: boolean;
};

const ALL_OPTS: CleanOptions = {
  docx: true,
  pdf: true,
  tex: true,
  site: true,
  temp: true,
  exports: true,
  templates: true,
};

export async function clean(session: ISession, files: string[], opts: CleanOptions) {
  if (opts.all) opts = { ...opts, ...ALL_OPTS };
  const { site, temp, exports, templates, yes } = opts;
  const exportOptionsList = await collectAllBuildExportOptions(session, files, opts);
  let pathsToDelete: string[] = [];
  exportOptionsList.forEach((exportOptions) => {
    pathsToDelete.push(exportOptions.output);
    if (exportOptions.format === ExportFormats.pdftex) {
      pathsToDelete.push(getLogOutputFolder(exportOptions.output));
      pathsToDelete.push(getTexOutputFolder(exportOptions.output));
    }
  });
  let buildFolders: string[] = [];
  if (temp || exports || templates) {
    const projectPaths = [
      ...getProjectPaths(session),
      ...exportOptionsList.map((exp) => exp.$project),
    ];
    projectPaths
      .filter((projPath): projPath is string => Boolean(projPath))
      .forEach((projPath) => {
        buildFolders.push(path.join(projPath, '_build'));
      });
    buildFolders.push(session.buildPath());
  }
  buildFolders = [...new Set(buildFolders)].sort();
  if (temp || exports || templates) {
    buildFolders.forEach((folder) => {
      if (temp) pathsToDelete.push(path.join(folder, 'temp'));
      if (exports) pathsToDelete.push(path.join(folder, 'exports'));
      if (templates) pathsToDelete.push(path.join(folder, 'templates'));
    });
  }
  if (site) {
    pathsToDelete.push(session.sitePath());
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
      session.log.info(`🗑 Deleting: ${pathToDelete}`);
      fs.rmSync(pathToDelete, { recursive: true, force: true });
    });
    buildFolders.forEach((buildFolder) => {
      if (fs.readdirSync(buildFolder).length === 0) {
        session.log.debug(`🗑 Deleting empty build folder: ${buildFolder}`);
        fs.rmSync(buildFolder, { recursive: true, force: true });
      }
    });
  }
}
