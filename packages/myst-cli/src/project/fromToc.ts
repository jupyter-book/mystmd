import fs from 'fs';
import { join, parse } from 'path';
import type { JupyterBookChapter } from '../utils/index.js';
import {
  readTOC,
  tocFile,
  VALID_FILE_EXTENSIONS,
  fileInfo,
  nextLevel,
  resolveExtension,
} from '../utils/index.js';
import type { ISession } from '../session/types.js';
import type {
  PageLevels,
  LocalProjectFolder,
  LocalProjectPage,
  LocalProject,
  PageSlugs,
} from './types.js';

function pagesFromChapters(
  session: ISession,
  path: string,
  chapters: JupyterBookChapter[],
  pages: (LocalProjectFolder | LocalProjectPage)[] = [],
  level: PageLevels = 1,
  pageSlugs: PageSlugs,
): (LocalProjectFolder | LocalProjectPage)[] {
  chapters.forEach((chapter) => {
    // TODO: support globs and urls
    const file = chapter.file ? resolveExtension(join(path, chapter.file)) : undefined;
    if (file) {
      const { slug } = fileInfo(file, pageSlugs);
      pages.push({ file, level, slug });
    }
    if (!file && chapter.file) {
      session.log.error(`File from ${tocFile(path)} not found: ${chapter.file}`);
    }
    if (!file && chapter.title) {
      pages.push({ level, title: chapter.title });
    }
    if (chapter.sections) {
      pagesFromChapters(session, path, chapter.sections, pages, nextLevel(level), pageSlugs);
    }
  });
  return pages;
}

/**
 * Build project structure from jupyterbook '_toc.yml' file
 */
export function projectFromToc(
  session: ISession,
  path: string,
  level: PageLevels = 1,
): Omit<LocalProject, 'bibliography'> {
  const filename = tocFile(path);
  if (!fs.existsSync(filename)) {
    throw new Error(`Could not find TOC "${filename}". Please create a '_toc.yml'.`);
  }
  const { dir, base } = parse(filename);
  const toc = readTOC(session.log, { filename: base, path: dir });
  const pageSlugs: PageSlugs = {};
  const indexFile = resolveExtension(join(path, toc.root));
  if (!indexFile) {
    throw Error(
      `The table of contents defined in "${tocFile(path)}" could not find file "${
        toc.root
      }" defined as the "root:" page. Please ensure that one of these files is defined:\n- ${VALID_FILE_EXTENSIONS.map(
        (ext) => join(path, `${toc.root}${ext}`),
      ).join('\n- ')}\n`,
    );
  }
  const { slug } = fileInfo(indexFile, pageSlugs);
  const pages: (LocalProjectFolder | LocalProjectPage)[] = [];
  if (toc.chapters) {
    pagesFromChapters(session, path, toc.chapters, pages, level, pageSlugs);
  } else if (toc.parts) {
    toc.parts.forEach((part, index) => {
      if (part.caption) {
        pages.push({ title: part.caption || `Part ${index + 1}`, level });
      }
      if (part.chapters) {
        pagesFromChapters(session, path, part.chapters, pages, nextLevel(level), pageSlugs);
      }
    });
  }
  return { path, file: indexFile, index: slug, pages };
}

/**
 * Return only project pages/folders from a '_toc.yml' file
 *
 * The root file is converted into just another top-level page.
 */
export function pagesFromToc(
  session: ISession,
  path: string,
  level: PageLevels,
): (LocalProjectFolder | LocalProjectPage)[] {
  const { file, index, pages } = projectFromToc(session, path, nextLevel(level));
  pages.unshift({ file, slug: index, level });
  return pages;
}
