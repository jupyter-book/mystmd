import fs from 'node:fs';
import { join, parse, resolve, sep } from 'node:path';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import type { JupyterBookChapter } from '../utils/toc.js';
import { readSphinxTOC, tocFile } from '../utils/toc.js';
import { VALID_FILE_EXTENSIONS, isValidFile, resolveExtension } from '../utils/resolveExtension.js';
import { createTitle, fileInfo } from '../utils/fileInfo.js';
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
import type {
  TOC,
  Entry,
  ParentEntry,
  FileEntry,
  PatternEntry,
  URLEntry,
  FileParentEntry,
  URLParentEntry,
} from 'myst-toc';
import { isFile, isPattern, isURL } from 'myst-toc';
import { globSync } from 'glob';
import { isDirectory } from 'myst-cli-utils';

export const DEFAULT_INDEX_FILENAMES = ['index', 'readme', 'main'];

const DEFAULT_INDEX_WITH_EXT = ['.md', '.ipynb']
  .map((ext) => DEFAULT_INDEX_FILENAMES.map((file) => `${file}${ext}`))
  .flat();

type EntryWithoutPattern = FileEntry | URLEntry | FileParentEntry | URLParentEntry | ParentEntry;

/** Sort any folders/files to ensure that `chapter10`, etc., comes after `chapter9` */
export function sortByNumber(a: string, b: string) {
  // Replace any repeated numbers with padded zeros
  const regex = /(\d+)/g;
  const paddedA = a.replace(regex, (match) => match.padStart(10, '0'));
  const paddedB = b.replace(regex, (match) => match.padStart(10, '0'));
  // Compare the modified strings
  return paddedA.localeCompare(paddedB);
}

/**
 * Take path parts and fill into nested object structure.
 *
 * For example, given:
 *
 * parts = ['one', 'two', 'three']
 *
 * This builds:
 *
 * {
 *   one: {
 *     two: {
 *       three: {},
 *     },
 *   },
 * }
 */
export function objFromPathParts(parts: string[], obj?: Record<string, any>) {
  if (!obj) obj = {};
  const [part, ...remainingParts] = parts;
  if (!part) return obj;
  if (!obj[part]) obj[part] = {} as Record<string, any>;
  obj[part] = objFromPathParts(remainingParts, obj[part]);
  return obj;
}

/**
 * Take glob pattern and create nested pseudo-directory structure
 *
 * For example, given a pattern that resolves to:
 *
 * matches = [
 *   'one/two/three',
 *   'one/two/four',
 *   'five',
 * ]
 *
 * This builds:
 *
 * {
 *   one: {
 *     two: {
 *       three: {},
 *       four: {},
 *     },
 *   },
 *   five: {},
 * }
 */
export function patternToDirectoryStructure(
  pattern: string,
  path: string,
  opts?: Omit<Parameters<typeof globSync>[1], 'withFileTypes'>,
) {
  const matches = globSync(pattern, { cwd: path, ...opts });
  const dirStructure: Record<string, any> = {};
  matches.forEach((match) => {
    // Glob always uses '/' separator, not filesystem separator
    const fileParts = match.split('/');
    objFromPathParts(fileParts, dirStructure);
  });
  return dirStructure;
}

/**
 * Take "directory structure" object and return corresponding toc entries
 *
 * The resulting entries are only FileEntries and ParentEntries. Similar
 * to the implicit project ordering, files come before parents.
 *
 * For example, given:
 *
 * dirStructure = {
 *   one: {
 *     two: {
 *       three: {},
 *       four: {},
 *     },
 *   },
 *   five: {},
 * }
 *
 * This builds:
 *
 * [
 *   { file: 'five' },
 *   {
 *     title: one,
 *     children: [
 *       {
 *          title: two,
 *          children: [
 *            { file: 'four' },
 *            { file: 'three' },
 *          ],
 *       },
 *     ],
 *   },
 * ]
 */
export function directoryStructureToFileEntries(
  dirStructure: Record<string, any>,
  path: string,
  ignore: string[],
): (FileEntry | ParentEntry)[] {
  let files = Object.keys(dirStructure)
    // .map((file) => join(path, file))
    .filter((file) => !ignore || !ignore.includes(join(path, file)))
    .sort(sortByNumber);
  let indexFile: string | undefined;
  DEFAULT_INDEX_WITH_EXT.forEach((index) => {
    if (indexFile) return;
    indexFile = files.find((file) => file.toLowerCase() === index);
  });
  if (indexFile) {
    files = [indexFile, ...files.filter((file) => file !== indexFile)];
  }
  const entries = [
    ...files
      .filter((file) => isValidFile(file) && Object.keys(dirStructure[file]).length === 0)
      .map((file): FileEntry => {
        return { file: join(path, file) };
      }),
    ...files
      .filter((dir) => Object.keys(dirStructure[dir]).length > 0)
      .map((dir): ParentEntry => {
        return {
          title: createTitle(dir),
          children: directoryStructureToFileEntries(dirStructure[dir], join(path, dir), ignore),
        };
      }),
  ];
  return entries;
}

/**
 * Traverse toc entries and return a list of files
 */
export function listExplicitFiles(entries: Entry[], path: string): string[] {
  const files: string[] = [];
  entries.forEach((entry) => {
    if ((entry as FileEntry).file) {
      files.push(resolve(path, (entry as FileEntry).file));
    }
    if ((entry as ParentEntry).children) {
      files.push(...listExplicitFiles((entry as ParentEntry).children, path));
    }
  });
  return files;
}

/**
 * Resolve pattern entries in a toc in the same way as implicit project sorting
 *
 * This is a normalization function that should be run on the toc prior to computing pages.
 *
 * - Resolution of pattern matches implicit structure (alpha sorting, respecting numbering)
 * - However, implicitly ignored files (node_modules, _build, .*) are _not_ ignored
 * - Project `exclude` files are still respected
 * - Pages never show up twice even if they match multiple patterns
 */
export function patternsToFileEntries(
  session: ISession,
  entries: Entry[],
  path: string,
  ignore: string[],
  file: string,
): EntryWithoutPattern[] {
  return entries
    .map((entry) => {
      if (isPattern(entry)) {
        const { pattern } = entry as PatternEntry;
        const dirStructure = patternToDirectoryStructure(pattern, path);
        const newEntries = directoryStructureToFileEntries(dirStructure, path, ignore);
        if (newEntries.length === 0) {
          addWarningForFile(
            session,
            file,
            `Pattern from table of contents did not match any files: ${pattern}`,
            'error',
            {
              ruleId: RuleId.tocContentsExist,
            },
          );
        }
        ignore.push(...listExplicitFiles(newEntries, path));
        return newEntries;
      }
      const { children } = entry as ParentEntry;
      if (children) {
        const newChildren = patternsToFileEntries(session, children, path, ignore, file);
        return { ...entry, children: newChildren };
      }
      return entry;
    })
    .flat();
}

function pagesFromEntries(
  session: ISession,
  path: string,
  entries: EntryWithoutPattern[],
  pages: (LocalProjectFolder | LocalProjectPage)[] = [],
  level: PageLevels = 1,
  pageSlugs: PageSlugs,
): (LocalProjectFolder | LocalProjectPage)[] {
  const configFile = selectors.selectLocalConfigFile(session.store.getState(), path);
  for (const entry of entries) {
    let entryLevel = level;
    if (isFile(entry)) {
      // Level must be "chapter" (0) or "section" (1-6) for files
      entryLevel = level < 0 ? 0 : level;
      const file = resolveExtension(resolve(path, entry.file), (message, errorLevel, note) => {
        addWarningForFile(session, configFile, message, errorLevel, {
          ruleId: RuleId.tocContentsExist,
          note,
        });
      });
      if (file && fs.existsSync(file) && !isDirectory(file)) {
        const { slug } = fileInfo(file, pageSlugs);
        pages.push({ file, level: entryLevel, slug });
      }
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
        parentEntry.children as EntryWithoutPattern[],
        pages,
        nextLevel(entryLevel),
        pageSlugs,
      );
    }
  }
  return pages;
}

/**
 * Get a list of ignored files, including configs and project.exclude entries
 */
export function getIgnoreFiles(session: ISession, path: string) {
  const rootConfigYamls = session.configFiles.map((file) => join(path, file));
  const projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), path);
  const excludePatterns = projectConfig?.exclude ?? [];
  const excludeFiles = excludePatterns
    .map((pattern) => {
      const matches = globSync(pattern, { cwd: path, absolute: true });
      return matches.map((match) => match.split('/').join(sep));
    })
    .flat();
  return [...rootConfigYamls, ...excludeFiles];
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
  const ignoreFiles = [...getIgnoreFiles(session, path), ...listExplicitFiles(toc, path)];
  const warnFile =
    file ??
    selectors.selectLocalConfigFile(session.store.getState(), path) ??
    join(path, session.configFiles[0]);
  const tocWithoutPatterns = patternsToFileEntries(session, toc, path, ignoreFiles, warnFile);
  const [root, ...entries] = tocWithoutPatterns;
  if (!root) {
    throw new Error('Project TOC must have at least one item');
  }
  // TODO: Relax project structure so these index file constraints may be lifted
  if (!isFile(root)) {
    throw new Error(`First TOC item must be a file`);
  }
  if ((root as ParentEntry).children?.length) {
    throw new Error(`First TOC item cannot have children`);
  }
  const indexFile = resolveExtension(resolve(path, root.file), (message, errorLevel, note) => {
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
