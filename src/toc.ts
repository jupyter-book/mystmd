import fs from 'fs';
import path from 'path';

export type pageLevels = 1 | 2 | 3 | 4 | 5 | 6;

export type SiteFolder = {
  title: string;
  level: pageLevels;
};

export type SitePage = {
  file: string;
  slug: string;
} & SiteFolder;

export type SiteSection = {
  file: string;
  slug: string;
  title: string;
  pages: (SitePage | SiteFolder)[];
};

const DEFAULT_INDEX_FILES = ['readme.md', 'README.md'];
const VALID_FILE_EXTENSIONS = ['.md', '.ipynb'];

function isValidFile(file: string): boolean {
  return VALID_FILE_EXTENSIONS.includes(path.parse(file).ext);
}

function isDirectory(file: string): boolean {
  return fs.lstatSync(file).isDirectory();
}

export function siteSectionFromFolder(index?: string, folder?: string): SiteSection {
  if (!index) {
    index = DEFAULT_INDEX_FILES.find((file) => fs.existsSync(file));
  }
  if (!index || !fs.existsSync(index)) {
    throw Error(`index file ${index || DEFAULT_INDEX_FILES.join(',')} not found`);
  }
  const { slug, title } = fileInfo(index);
  const pages = sitePagesFromFolder(folder || '', 1, [index]);
  return { file: index, slug, title, pages };
}

export function sitePagesFromFolder(
  folder: string,
  level: pageLevels,
  ignore?: string[],
): (SiteFolder | SitePage)[] {
  const contents = fs
    .readdirSync(folder)
    .map((file) => path.join(folder, file))
    .filter((file) => !ignore || !ignore.includes(file))
    .filter((file) => isValidFile(file) || isDirectory(file))
    .sort();
  return contents
    .map((file) => {
      if (isValidFile(file)) {
        return {
          file,
          level,
          ...fileInfo(file),
        };
      }
      const folder = { title: fileInfo(file).title, level };
      const newLevel = level < 5 ? level + 1 : 6;
      const pages = sitePagesFromFolder(file, newLevel as pageLevels, ignore);
      return pages.length ? [folder].concat(pages) : [];
    })
    .flat();
}

export function fileInfo(file: string): { slug: string; title: string } {
  const slug = path.parse(file).name.toLowerCase();
  return { slug, title: slug };
}
