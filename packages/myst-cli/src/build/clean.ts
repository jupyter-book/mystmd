import fs from 'node:fs';
import path from 'node:path';
import inquirer from 'inquirer';
import { ExportFormats } from 'myst-frontmatter';
import { promptContinue } from '../cli/options.js';
import type { ISession } from '../session/index.js';
import { collectAllBuildExportOptions, getProjectPaths } from './build.js';
import { getLogOutputFolder, getTexOutputFolder } from './pdf/create.js';

export type CleanOptions = {
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  xml?: boolean;
  site?: boolean;
  html?: boolean;
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
  xml: true,
  site: true,
  html: true,
  temp: true,
  exports: true,
  templates: true,
};
const DEFAULT_OPTS: CleanOptions = {
  docx: true,
  pdf: true,
  tex: true,
  xml: true,
  site: true,
  html: true,
  temp: true,
  exports: true,
};

function coerceOpts(opts: CleanOptions) {
  const { docx, pdf, tex, xml, site, html, temp, exports, templates, all } = opts;
  if (all) return { ...opts, ...ALL_OPTS };
  if (!docx && !pdf && !tex && !xml && !site && !html && !temp && !exports && !templates) {
    return { ...opts, ...DEFAULT_OPTS };
  }
  return { ...opts };
}

/**
 * Returns true if 'item' is a subpath under folder
 *
 * e.g. isSubpath('_build/exports/out.pdf', '_build/exports') => true
 *      isSubpath('_build/exports', '_build/exports/out.pdf') => false
 *      isSubpath('_build/exports', '_build/exports') => false
 */
function isSubpath(item: string, folder: string) {
  if (item === folder) return false;
  const itemParts = item.split(path.sep);
  const folderParts = folder.split(path.sep);
  let subpath = true;
  folderParts.forEach((part, index) => {
    if (itemParts[index] !== part) subpath = false;
  });
  return subpath;
}

function isSubpathOfAny(item: string, folders: string[]) {
  let subpath = false;
  folders.forEach((folder) => {
    if (isSubpath(item, folder)) subpath = true;
  });
  return subpath;
}

function deduplicatePaths(paths: string[]) {
  const uniquePaths = [...new Set(paths)];
  return uniquePaths.filter((item) => !isSubpathOfAny(item, [...uniquePaths]));
}

export async function clean(session: ISession, files: string[], opts: CleanOptions) {
  opts = coerceOpts(opts);
  const { site, html, temp, exports, templates, yes } = opts;
  let pathsToDelete: string[] = [];
  const exportOptionsList = await collectAllBuildExportOptions(session, files, opts);
  if (exports) {
    exportOptionsList.forEach((exportOptions) => {
      pathsToDelete.push(exportOptions.output);
      if (exportOptions.format === ExportFormats.pdftex) {
        pathsToDelete.push(getLogOutputFolder(exportOptions.output));
        pathsToDelete.push(getTexOutputFolder(exportOptions.output));
      }
    });
  }
  let buildFolders: string[] = [];
  if (temp || exports || templates || html) {
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
  if (temp || exports || templates || html) {
    buildFolders.forEach((folder) => {
      if (temp) pathsToDelete.push(path.join(folder, 'temp'));
      if (exports) pathsToDelete.push(path.join(folder, 'exports'));
      if (templates) pathsToDelete.push(path.join(folder, 'templates'));
      if (html) pathsToDelete.push(path.join(folder, 'html'));
    });
  }
  if (site) {
    pathsToDelete.push(session.sitePath());
  }
  pathsToDelete = deduplicatePaths(pathsToDelete.filter((p) => fs.existsSync(p))).sort();
  if (pathsToDelete.length === 0) {
    session.log.warn(`🧹 Your folders are already so clean! ✨`);
    return;
  }
  session.log.info(`Deleting all the following paths:\n\n  - ${pathsToDelete.join('\n  - ')}\n`);
  const cont = yes || (await inquirer.prompt([promptContinue()])).cont;
  if (cont) {
    pathsToDelete.forEach((pathToDelete) => {
      session.log.info(`🗑  Deleting: ${pathToDelete}`);
      fs.rmSync(pathToDelete, { recursive: true, force: true });
    });
    // Delete any empty build folders
    buildFolders.forEach((buildFolder) => {
      if (fs.existsSync(buildFolder) && fs.readdirSync(buildFolder).length === 0) {
        session.log.debug(`Deleting empty build folder: ${buildFolder}`);
        fs.rmSync(buildFolder, { recursive: true, force: true });
      }
    });
  }
}
