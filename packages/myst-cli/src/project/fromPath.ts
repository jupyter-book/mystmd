import fs from 'node:fs';
import { extname, join } from 'node:path';
import { isDirectory } from 'myst-cli-utils';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { fileInfo, fileTitle } from '../utils/fileInfo.js';
import { nextLevel } from '../utils/nextLevel.js';
import { VALID_FILE_EXTENSIONS, isValidFile } from '../utils/resolveExtension.js';
import { shouldIgnoreFile } from '../utils/shouldIgnoreFile.js';
import {
  DEFAULT_INDEX_FILENAMES,
  getIgnoreFiles,
  pagesFromSphinxTOC,
  comparePaths,
} from './fromTOC.js';
import type {
  PageLevels,
  LocalProjectFolder,
  LocalProjectPage,
  LocalProject,
  PageSlugs,
  SlugOptions,
} from './types.js';

type Options = SlugOptions & {
  ignore?: string[];
  suppressWarnings?: boolean;
};

/**
 * Recursively traverse path for md/ipynb files
 */
function projectPagesFromPath(
  session: ISession,
  path: string,
  level: PageLevels,
  pageSlugs: PageSlugs,
  opts?: Options,
): (LocalProjectFolder | LocalProjectPage)[] {
  const { ignore, suppressWarnings } = opts || {};
  const contents = fs
    .readdirSync(path)
    .filter((file) => !shouldIgnoreFile(session, file))
    .map((file) => join(path, file))
    .filter((file) => !ignore || !ignore.includes(file))
    .sort(comparePaths);

  if (session.configFiles.filter((file) => contents.includes(join(path, file))).length) {
    session.log.debug(`🔍 Found config file, ignoring subdirectory: ${path}`);
    return [];
  }
  if (contents.includes(join(path, '_toc.yml'))) {
    const prevLevel = (level < 2 ? 1 : level - 1) as PageLevels;
    try {
      // TODO: We don't yet have a way to do nested tocs with new-style toc
      session.log.debug(`Respecting legacy TOC in subdirectory: ${join(path, '_toc.yml')}`);
      return pagesFromSphinxTOC(session, path, prevLevel, opts);
    } catch {
      if (!suppressWarnings) {
        addWarningForFile(
          session,
          join(path, '_toc.yml'),
          `Invalid table of contents ignored`,
          'warn',
          { ruleId: RuleId.validTOC },
        );
      }
    }
  }
  const files: (LocalProjectFolder | LocalProjectPage)[] = contents
    .filter((file) => isValidFile(file))
    .map((file) => {
      return {
        file,
        level,
        slug: fileInfo(file, pageSlugs, opts).slug,
        implicit: true,
      } as LocalProjectPage;
    });
  const folders = contents
    .filter((file) => isDirectory(file))
    .sort(comparePaths)
    .map((dir) => {
      const projectFolder: LocalProjectFolder = {
        title: fileTitle(dir),
        level,
      };
      const pages = projectPagesFromPath(session, dir, nextLevel(level), pageSlugs, opts);
      if (!pages.length) {
        return [];
      }
      if (pages[0].level === level) {
        // If first folder page is given same level as folder itself, do not include folder.
        // This happens if _toc.yml with index file is present in the folder.
        return pages;
      }
      return [projectFolder, ...pages];
    })
    .flat();
  return files.concat(folders);
}

/**
 * Pick index file from project pages
 *
 * If "{path}/index.md" or "{path}/readme.md" exist, use that. Otherwise, use the first
 * markdown file. Otherwise, use the first file of any type.
 *
 * This does not look into subdirectories for index files. If no index file is at the top level,
 * it will use the first file, regardless of filename.
 */
function indexFileFromPages(pages: (LocalProjectFolder | LocalProjectPage)[], path: string) {
  let indexFile: string | undefined;
  const files = pages
    .filter((page): page is LocalProjectPage => 'file' in page)
    .map((page) => page.file);

  const matcher = (ext: string) => {
    // Find default index file with given extension "ext" in "files" list
    let match: string | undefined;
    DEFAULT_INDEX_FILENAMES.map((index) => `${index}${ext}`)
      .map((index) => join(path, index).toLowerCase())
      .forEach((index) => {
        if (match) return;
        files.forEach((file) => {
          if (file.toLowerCase() === index) match = file;
        });
      });
    return match;
  };

  if (!indexFile) indexFile = matcher('.md');
  if (!indexFile) indexFile = matcher('.tex');
  if (!indexFile) indexFile = matcher('.ipynb');
  if (!indexFile) indexFile = matcher('.myst.json');
  if (!indexFile) [indexFile] = files.filter((file) => extname(file) === '.md');
  if (!indexFile) [indexFile] = files.filter((file) => extname(file) === '.tex');
  if (!indexFile) [indexFile] = files.filter((file) => extname(file) === '.ipynb');
  if (!indexFile) [indexFile] = files.filter((file) => file.endsWith('.myst.json'));
  if (!indexFile) [indexFile] = files;
  return indexFile;
}

/**
 * Build project structure from local file/folder structure.
 */
export function projectFromPath(
  session: ISession,
  path: string,
  indexFile?: string,
  opts?: SlugOptions,
): Omit<LocalProject, 'bibliography'> {
  const ext_string = VALID_FILE_EXTENSIONS.join(' or ');
  if (indexFile) {
    if (!isValidFile(indexFile))
      throw Error(`Index file ${indexFile} has invalid extension; must be ${ext_string}}`);
    if (!fs.existsSync(indexFile)) throw Error(`Index file ${indexFile} not found`);
  }
  if (opts?.urlFolders && !opts.projectPath) opts.projectPath = path;
  const ignoreFiles = getIgnoreFiles(session, path);
  let implicitIndex = false;
  if (!indexFile) {
    const searchPages = projectPagesFromPath(
      session,
      path,
      1,
      {},
      { ...opts, ignore: ignoreFiles, suppressWarnings: true },
    );
    if (!searchPages.length) {
      throw Error(`No valid files with extensions ${ext_string} found in path "${path}"`);
    }
    indexFile = indexFileFromPages(searchPages, path);
    if (!indexFile) throw Error(`Unable to find any index file in path "${path}"`);
    implicitIndex = true;
  }
  const pageSlugs: PageSlugs = {};
  const { slug } = fileInfo(indexFile, pageSlugs, { ...opts, session });
  const pages = projectPagesFromPath(session, path, 1, pageSlugs, {
    ...opts,
    ignore: [indexFile, ...ignoreFiles],
  });
  return { file: indexFile, index: slug, path, pages, implicitIndex };
}
