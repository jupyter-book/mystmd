import fs from 'fs';
import { join } from 'path';
import { JupyterBookChapter, readTOC, tocFile } from '../export/jupyter-book/toc';
import { ISession } from '../session/types';
import { pageLevels, LocalProjectFolder, LocalProjectPage, LocalProject } from './types';
import { fileInfo, getCitationPaths, PageSlugs, resolveExtension } from './utils';

function pagesFromChapters(
  session: ISession,
  path: string,
  chapters: JupyterBookChapter[],
  pages: (LocalProjectFolder | LocalProjectPage)[] = [],
  level: pageLevels = 1,
  pageSlugs: PageSlugs,
): (LocalProjectFolder | LocalProjectPage)[] {
  chapters.forEach((chapter) => {
    // TODO: support globs and urls
    const file = chapter.file ? resolveExtension(join(path, chapter.file)) : undefined;
    if (file) {
      pages.push({ file, level, ...fileInfo(file, pageSlugs) });
    }
    if (!file && chapter.file) {
      session.log.error(`File from ${tocFile(path)} not found: ${chapter.file}`);
    }
    if (!file && chapter.title) {
      pages.push({ level, title: chapter.title });
    }
    if (chapter.sections) {
      const newLevel = level < 5 ? level + 1 : 6;
      pagesFromChapters(session, path, chapter.sections, pages, newLevel as pageLevels, pageSlugs);
    }
  });
  return pages;
}

/**
 * Build project structure from jupyterbook '_toc.yml' file
 */
export function projectFromToc(session: ISession, path: string): LocalProject {
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
    pagesFromChapters(session, path, toc.chapters, pages, 1, pageSlugs);
  } else if (toc.parts) {
    toc.parts.forEach((part, index) => {
      if (part.caption) {
        pages.push({ title: part.caption || `Part ${index + 1}`, level: 1 });
      }
      if (part.chapters) {
        pagesFromChapters(session, path, part.chapters, pages, 2, pageSlugs);
      }
    });
  }
  const citations = getCitationPaths(session, path);
  return { path, file: indexFile, index: slug, pages, citations };
}
