import fs from 'fs';
import yaml from 'js-yaml';
import { join } from 'path';
import { JupyterBookChapter, TOC } from '../export/jupyter-book/toc';
import { pageLevels, LocalProjectFolder, LocalProjectPage, LocalProject } from './types';
import { removeExtension } from './utils';

const GENERATED_TOC_HEADER = `
# Table of Contents
#
# Curvenote will respect:
# 1. New pages
#      - file: relative/path/to/page
# 2. New sections without an associated page
#      - title: Folder Title
#        sections: ...
# 3. New sections with an associated page
#      - file: relative/path/to/page
#        sections: ...
#
# Note: Titles defined on pages here are not recognized.
#
# This spec is based on the Jupyterbook table of contents.
# Learn more at https://jupyterbook.org/customize/toc.html

`;

function chaptersFromPages(pages: (LocalProjectFolder | LocalProjectPage)[]) {
  const levels = pages.map((page) => page.level);
  const currentLevel = Math.min(...levels) as pageLevels;
  const currentLevelIndices = levels.reduce((inds: number[], val: pageLevels, i: number) => {
    if (val === currentLevel) {
      inds.push(i);
    }
    return inds;
  }, []);
  const chapters: JupyterBookChapter[] = currentLevelIndices.map((index, i) => {
    let nextPages: (LocalProjectFolder | LocalProjectPage)[];
    if (currentLevelIndices[i + 1]) {
      nextPages = pages.slice(index + 1, currentLevelIndices[i + 1]);
    } else {
      nextPages = pages.slice(index + 1);
    }
    const chapter: JupyterBookChapter = {};
    if ('file' in pages[index]) {
      const page = pages[index] as LocalProjectPage;
      chapter.file = removeExtension(page.file);
    } else if ('title' in pages[index]) {
      const page = pages[index] as LocalProjectFolder;
      chapter.title = page.title;
    }
    if (nextPages.length) {
      chapter.sections = chaptersFromPages(nextPages);
    }
    return chapter;
  });
  return chapters;
}

/**
 * Create a jupyterbook toc structure from project pages
 *
 * Output consists of a top-level chapter with files/sections
 * based on project structure. Sections headings may be either
 * associated with a `file` (results in clickable curvespace page)
 * or just a `title` (results in unclickable curvespace heading)
 */
export function tocFromProject(project: LocalProject) {
  const toc: TOC = {
    format: 'jb-book',
    root: removeExtension(project.file),
    chapters: chaptersFromPages(project.pages),
  };
  return toc;
}

export function writeTocFromProject(project: LocalProject, path: string) {
  const filename = join(path, '_toc.yml');
  const content = `${GENERATED_TOC_HEADER}${yaml.dump(tocFromProject(project))}`;
  fs.writeFileSync(filename, content);
}
