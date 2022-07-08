import fs from 'fs';
import { join } from 'path';
import { JupyterBookChapter, readTOC, tocFile } from '../export/jupyter-book/toc';
import { ISession } from '../session/types';
import { PageLevels, LocalProjectFolder, LocalProjectPage, LocalProject } from './types';
import { fileInfo, getCitationPaths, nextLevel, PageSlugs, resolveExtension } from './utils';

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
): LocalProject {
  const filename = tocFile(path);
  if (!fs.existsSync(filename)) {
    throw new Error(`Could not find TOC "${filename}". Please create a '_toc.yml'.`);
  }
  const toc = readTOC(session.log, { filename });
  const pageSlugs: PageSlugs = {};
  const indexFile = resolveExtension(join(path, toc.root));
  if (!indexFile) {
    throw Error(`Root from ${tocFile(path)} not found: ${indexFile}`);
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
  const citations = getCitationPaths(session, path);
  return { path, file: indexFile, index: slug, pages, citations };
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
  const { file, index, pages, citations } = projectFromToc(session, path, nextLevel(level));
  if (citations.length) {
    session.log.debug(`Ignoring citation files from ${join(path, '_toc.yml')}`);
  }
  pages.unshift({ file, slug: index, level });
  return pages;
}
