import fs from 'fs';
import { extname, join } from 'path';
import { CURVENOTE_YML } from '../config/types';
import { ISession } from '../session/types';
import { pageLevels, LocalProjectFolder, LocalProjectPage, LocalProject } from './types';
import {
  fileInfo,
  getCitationPaths,
  isDirectory,
  isValidFile,
  PageSlugs,
  VALID_FILE_EXTENSIONS,
} from './utils';

const DEFAULT_INDEX_FILENAMES = ['index', 'readme'];

function alwaysIgnore(file: string) {
  const ignore = ['node_modules', '_build'];
  return file.startsWith('.') || ignore.includes(file);
}

/**
 * Recursively traverse path for md/ipynb files
 */
function projectPagesFromPath(
  path: string,
  level: pageLevels,
  pageSlugs: PageSlugs,
  ignore?: string[],
): (LocalProjectFolder | LocalProjectPage)[] {
  const contents = fs
    .readdirSync(path)
    .filter((file) => !alwaysIgnore(file))
    .map((file) => join(path, file))
    .filter((file) => !ignore || !ignore.includes(file))
    .sort();
  if (contents.includes(join(path, CURVENOTE_YML))) {
    // Stop when we encounter another site/project curvenote config
    return [];
  }
  const files: (LocalProjectFolder | LocalProjectPage)[] = contents
    .filter((file) => isValidFile(file))
    .map((file) => {
      return {
        file,
        level,
        slug: fileInfo(file, pageSlugs).slug,
      } as LocalProjectPage;
    });
  const folders = contents
    .filter((file) => isDirectory(file))
    .map((file) => {
      const projectFolder: LocalProjectFolder = { title: fileInfo(file, pageSlugs).title, level };
      const newLevel = level < 5 ? level + 1 : 6;
      const pages = projectPagesFromPath(file, newLevel as pageLevels, pageSlugs, ignore);
      return pages.length ? [projectFolder, ...pages] : [];
    })
    .flat();
  return files.concat(folders);
}

/**
 * Pick index file from project pages
 *
 * If "{path}/index.md" or "{path}/readme.md" exist, use that. Otherwise, use the first
 * markdown file. Otherwise, use the first file of any type.
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
  if (!indexFile) [indexFile] = files.filter((file) => extname(file) === '.md');
  if (!indexFile) indexFile = matcher('.ipynb');
  if (!indexFile) [indexFile] = files;
  return indexFile;
}

/**
 * Build project structure from local file/folder structure.
 */
export function projectFromPath(session: ISession, path: string, indexFile?: string): LocalProject {
  const ext_string = VALID_FILE_EXTENSIONS.join(' or ');
  if (indexFile) {
    if (!isValidFile(indexFile))
      throw Error(`Index file ${indexFile} has invalid extension; must be ${ext_string}}`);
    if (!fs.existsSync(indexFile)) throw Error(`Index file ${indexFile} not found`);
  }
  const rootCurvenoteYML = join(path, CURVENOTE_YML);
  if (!indexFile) {
    const searchPages = projectPagesFromPath(path, 1, {}, [rootCurvenoteYML]);
    if (!searchPages.length) {
      throw Error(`No valid files with extensions ${ext_string} found in path "${path}"`);
    }
    indexFile = indexFileFromPages(searchPages, path);
    if (!indexFile) throw Error(`Unable to find any index file in path "${path}"`);
  }
  const pageSlugs: PageSlugs = {};
  const { slug } = fileInfo(indexFile, pageSlugs);
  const pages = projectPagesFromPath(path, 1, pageSlugs, [indexFile, rootCurvenoteYML]);
  const citations = getCitationPaths(session, path);
  return { file: indexFile, index: slug, path, pages, citations };
}
