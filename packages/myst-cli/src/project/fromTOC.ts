import fs from 'node:fs';
import { join, parse } from 'node:path';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import type { JupyterBookChapter } from '../utils/toc.js';
import { readSphinxTOC, tocFile } from '../utils/toc.js';
import { VALID_FILE_EXTENSIONS, resolveExtension } from '../utils/resolveExtension.js';
import { fileInfo } from '../utils/fileInfo.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { nextLevel } from '../utils/nextLevel.js';
import { selectors } from '../store/index.js';
import type {
  PageLevels,
  LocalProjectFolder,
  LocalProjectPage,
  LocalProject,
  PageSlugs,
} from './types.js';
import type { TOC, Entry, ParentEntry } from 'myst-toc';
import { isFile, isPattern, isURL } from 'myst-toc';
import { globSync } from 'glob';
import { isDirectory } from 'myst-cli-utils';

function pagesFromEntries(
  session: ISession,
  path: string,
  entries: Entry[],
  pages: (LocalProjectFolder | LocalProjectPage)[] = [],
  level: PageLevels = 1,
  pageSlugs: PageSlugs,
): (LocalProjectFolder | LocalProjectPage)[] {
  const configFile = selectors.selectLocalConfigFile(session.store.getState(), path);
  for (const entry of entries) {
    let entryLevel = level;
    if (isFile(entry)) {
      // Level must be "chapter" or "section" for files
      entryLevel = level < 0 ? 0 : level;
      const file = resolveExtension(join(path, entry.file), (message, errorLevel, note) => {
        addWarningForFile(session, configFile, message, errorLevel, {
          ruleId: RuleId.tocContentsExist,
          note,
        });
      });

      if (file && fs.existsSync(file) && !isDirectory(file)) {
        const { slug } = fileInfo(file, pageSlugs);
        pages.push({ file, level: entryLevel, slug });
      }
    } else if (isPattern(entry)) {
      entryLevel = level < 0 ? 0 : level;
      const { pattern } = entry;
      const matches = globSync(pattern, { cwd: path });
      matches.forEach((filePath) => {
        const file = join(path, filePath);
        if (fs.existsSync(file)) {
          if (!isDirectory(file)) {
            const { slug } = fileInfo(file, pageSlugs);
            pages.push({ file, level: entryLevel, slug });
          }
        } else {
          addWarningForFile(
            session,
            configFile,
            `Referenced file not found: ${filePath}`,
            'error',
            {
              ruleId: RuleId.tocContentsExist,
            },
          );
        }
      });
    } else if (isURL(entry)) {
      addWarningForFile(
        session,
        configFile,
        `URLs in table of contents are not yet supported: ${entry.url}`,
        'warn',
        {
          ruleId: RuleId.tocContentsExist,
        },
      );
    } else {
      // Parent Entry - may be a "part" with level -1
      entryLevel = level < -1 ? -1 : level;
      pages.push({ level: entryLevel, title: entry.title });
    }

    // Do we have any children?
    const parentEntry = entry as Partial<ParentEntry>;
    if (parentEntry.children) {
      pagesFromEntries(
        session,
        path,
        parentEntry.children,
        pages,
        nextLevel(entryLevel),
        pageSlugs,
      );
    }
  }
  return pages;
}

/**
 * Build project structure from a MyST TOC
 *
 * Starting level may be provided; by default this is 1. Numbers up to
 * 6 may be provided for pages to start at a lower level. Level may
 * also be -1 or 0. In these cases, the first "part" level will be -1
 * and the first "chapter" level will be 0; However, "sections"
 * will never be level < 1.
 */
export function projectFromTOC(
  session: ISession,
  path: string,
  toc: TOC,
  level: PageLevels = 1,
  file?: string,
): Omit<LocalProject, 'bibliography'> {
  const pageSlugs: PageSlugs = {};
  const [root, ...entries] = toc;
  if (!root) {
    throw new Error('Project TOC must have at least one item');
  }
  if (!isFile(root)) {
    throw new Error(`First TOC item must be a file`);
  }
  const warnFile =
    file ??
    selectors.selectLocalConfigFile(session.store.getState(), path) ??
    join(path, session.configFiles[0]);
  const indexFile = resolveExtension(join(path, root.file), (message, errorLevel, note) => {
    addWarningForFile(session, warnFile, message, errorLevel, {
      ruleId: RuleId.tocContentsExist,
      note,
    });
  });
  if (!indexFile) {
    throw Error(`Could not resolve project index file: ${root.file}`);
  }
  const { slug } = fileInfo(indexFile, pageSlugs);
  const pages: (LocalProjectFolder | LocalProjectPage)[] = [];
  pagesFromEntries(session, path, entries, pages, level, pageSlugs);
  return { path: path || '.', file: indexFile, index: slug, pages };
}

function pagesFromSphinxChapters(
  session: ISession,
  path: string,
  chapters: JupyterBookChapter[],
  pages: (LocalProjectFolder | LocalProjectPage)[] = [],
  level: PageLevels = 1,
  pageSlugs: PageSlugs,
): (LocalProjectFolder | LocalProjectPage)[] {
  const filename = tocFile(path);
  const { dir } = parse(filename);
  chapters.forEach((chapter) => {
    // TODO: support globs and urls
    const file = chapter.file ? resolveExtension(join(dir, chapter.file)) : undefined;
    if (file) {
      const { slug } = fileInfo(file, pageSlugs);
      pages.push({ file, level, slug });
    }
    if (!file && chapter.file) {
      addWarningForFile(
        session,
        tocFile(path),
        `Referenced file not found: ${chapter.file}`,
        'error',
        { ruleId: RuleId.tocContentsExist },
      );
    }
    if (!file && chapter.title) {
      pages.push({ level, title: chapter.title });
    }
    if (chapter.sections) {
      pagesFromSphinxChapters(session, path, chapter.sections, pages, nextLevel(level), pageSlugs);
    }
  });
  return pages;
}

/**
 * Build project structure from jupyterbook '_toc.yml' file on a path
 *
 * Starting level may be provided; by default this is 1. Numbers up to
 * 6 may be provided for pages to start at a lower level. Level may
 * also be -1 or 0. In these cases, the first "part" level will be -1
 * and the first "chapter" level will be 0; However, "sections"
 * will never be level < 1.
 */
export function projectFromSphinxTOC(
  session: ISession,
  path: string,
  level: PageLevels = 1,
): Omit<LocalProject, 'bibliography'> {
  const filename = tocFile(path);
  if (!fs.existsSync(filename)) {
    throw new Error(`Could not find TOC "${filename}". Please create a '_toc.yml'.`);
  }
  const { dir, base } = parse(filename);
  const toc = readSphinxTOC(session.log, { filename: base, path: dir });

  const pageSlugs: PageSlugs = {};
  const indexFile = resolveExtension(join(dir, toc.root));
  if (!indexFile) {
    throw Error(
      `The table of contents defined in "${tocFile(path)}" could not find file "${
        toc.root
      }" defined as the "root:" page. Please ensure that one of these files is defined:\n- ${VALID_FILE_EXTENSIONS.map(
        (ext) => join(dir, `${toc.root}${ext}`),
      ).join('\n- ')}\n`,
    );
  }
  const { slug } = fileInfo(indexFile, pageSlugs);
  const pages: (LocalProjectFolder | LocalProjectPage)[] = [];
  if (toc.sections) {
    // Do not allow sections to have level < 1
    if (level < 1) level = 1;
    pagesFromSphinxChapters(session, path, toc.sections, pages, level, pageSlugs);
  } else if (toc.chapters) {
    // Do not allow chapters to have level < 0
    if (level < 0) level = 0;
    pagesFromSphinxChapters(session, path, toc.chapters, pages, level, pageSlugs);
  } else if (toc.parts) {
    // Do not allow parts to have level < -1
    if (level < -1) level = -1;
    toc.parts.forEach((part, index) => {
      if (part.caption) {
        pages.push({ title: part.caption || `Part ${index + 1}`, level });
      }
      if (part.chapters) {
        pagesFromSphinxChapters(session, path, part.chapters, pages, nextLevel(level), pageSlugs);
      }
    });
  }
  return { path: dir || '.', file: indexFile, index: slug, pages };
}

/**
 * Return only project pages/folders from a TOC
 *
 * The root file is converted into just another top-level page.
 */
export function pagesFromTOC(
  session: ISession,
  path: string,
  toc: TOC,
  level: PageLevels,
): (LocalProjectFolder | LocalProjectPage)[] {
  const { file, index, pages } = projectFromTOC(session, path, toc, nextLevel(level));
  pages.unshift({ file, slug: index, level });
  return pages;
}

/**
 * Return only project pages/folders from a '_toc.yml' file
 *
 * The root file is converted into just another top-level page.
 */
export function pagesFromSphinxTOC(
  session: ISession,
  path: string,
  level: PageLevels,
): (LocalProjectFolder | LocalProjectPage)[] {
  const { file, index, pages } = projectFromSphinxTOC(session, path, nextLevel(level));
  pages.unshift({ file, slug: index, level });
  return pages;
}
