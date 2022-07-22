import fs from 'fs';
import { extname, join, parse } from 'path';
import { title2name as createSlug } from '@curvenote/blocks';
import { loadConfigOrThrow } from '../config';
import { CURVENOTE_YML } from '../config/types';
import { ISession } from '../session';
import { selectors } from '../store';
import { PageLevels } from './types';

export const VALID_FILE_EXTENSIONS = ['.md', '.ipynb'];

export type PageSlugs = Record<string, number>;

export function nextLevel(level: PageLevels): PageLevels {
  return (level < 5 ? level + 1 : 6) as PageLevels;
}

export function isValidFile(file: string): boolean {
  return VALID_FILE_EXTENSIONS.includes(extname(file).toLowerCase());
}

export function isDirectory(file: string): boolean {
  return fs.lstatSync(file).isDirectory();
}

export function resolveExtension(file: string): string | undefined {
  if (fs.existsSync(file) && !isDirectory(file)) return file;
  const extensions = VALID_FILE_EXTENSIONS.concat(
    VALID_FILE_EXTENSIONS.map((ext) => ext.toUpperCase()),
  );
  return extensions.map((ext) => `${file}${ext}`).find((fileExt) => fs.existsSync(fileExt));
}

export function removeExtension(file: string): string {
  const { ext } = parse(file);
  if (ext) file = file.slice(0, file.length - ext.length);
  return file;
}

export function createTitle(s: string): string {
  return (
    s
      // https://stackoverflow.com/questions/18379254/regex-to-split-camel-case
      .split(/([A-Z][a-z0-9]+)|_|-/)
      .filter((e) => e)
      .join(' ')
      .trim()
      // Now make it into title case (simple, but good enough)
      .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()))
  );
}

function removeLeadingEnumeration(s: string): string {
  if (s.match(/^([12][0-9]{3})([^0-9])?/)) {
    // Starts with what looks like a year
    return s;
  }
  if (s.match(/^([0-9]{5})/)) {
    // More than five numbers
    return s;
  }
  const removed = s.replace(/^([0-9_.-]+)/, '');
  if (!removed) return s; // Never return an empty slug!
  return removed;
}

export function fileInfo(file: string, pageSlugs: PageSlugs): { slug: string; title: string } {
  const { name } = parse(file);
  let slug = createSlug(removeLeadingEnumeration(name));
  const title = createTitle(removeLeadingEnumeration(name));
  if (pageSlugs[slug]) {
    pageSlugs[slug] += 1;
    slug = `${slug}-${pageSlugs[slug] - 1}`;
  } else {
    pageSlugs[slug] = 1;
  }
  return { slug, title };
}

export function getCitationPaths(session: ISession, path: string): string[] {
  // TODO: traverse to find all bibs, and or read from toc/config
  const ref = join(path, 'references.bib');
  if (!fs.existsSync(ref)) {
    session.log.debug(`Expected citations at "${ref}"`);
    return [];
  }
  return [ref];
}

export function findProjectsOnPath(session: ISession, path: string) {
  let projectPaths: string[] = [];
  const content = fs.readdirSync(path);
  if (content.includes(CURVENOTE_YML)) {
    loadConfigOrThrow(session, path);
    if (selectors.selectLocalProjectConfig(session.store.getState(), path)) {
      projectPaths.push(path);
    }
  }
  content
    .map((dir) => join(path, dir))
    .filter((file) => isDirectory(file))
    .forEach((dir) => {
      projectPaths = projectPaths.concat(findProjectsOnPath(session, dir));
    });
  return projectPaths;
}
