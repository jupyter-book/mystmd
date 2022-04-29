import fs from 'fs';
import path from 'path';
import { WebConfig } from '../config/types';
import { ISession } from '../session/types';
import { JupyterBookChapter, readTOC } from '../export/jupyter-book/toc';
import { Options, Page, SiteConfig, SiteFolder } from './types';
import { publicPath } from './transforms';
import { CURVENOTE_YML } from '../config';

export function getFileName(folder: string, file: string) {
  const filenameMd = path.join(folder, `${file}.md`);
  const filenameIpynb = path.join(folder, `${file}.ipynb`);
  const isMarkdown = fs.existsSync(filenameMd);
  const isNotebook = fs.existsSync(filenameIpynb);
  if (!isMarkdown && !isNotebook)
    throw new Error(`Could not find "${file}". See '${folder}/_toc.yml'`);
  const filename = isMarkdown ? filenameMd : filenameIpynb;
  return { filename, isMarkdown, isNotebook };
}

function chaptersToPages(
  folder: string,
  chapters: JupyterBookChapter[],
  pages: Page[] = [],
  level = 1,
): Page[] {
  chapters.forEach((chapter) => {
    // Note: the title will get updated when the file is processed
    pages.push({ title: chapter.file, slug: chapter.file, level });
    if (chapter.sections) chaptersToPages(folder, chapter.sections, pages, level + 1);
  });
  return pages;
}

function copyLogo(session: ISession, opts: Options, logoName?: string | null): string | undefined {
  if (!logoName) {
    session.log.debug('No logo specified, Curvespace renderer will use default logo');
    return undefined;
  }
  if (!fs.existsSync(logoName)) {
    // Look in the local public path
    logoName = path.join('public', logoName);
  }
  if (!fs.existsSync(logoName))
    throw new Error(`Could not find logo at "${logoName}". See 'config.web.logo'`);
  const logo = `logo${path.extname(logoName)}`;
  fs.copyFileSync(logoName, path.join(publicPath(opts), logo));
  return `/${logo}`;
}

function copyActionResource(
  session: ISession,
  opts: Options,
  action: SiteConfig['site']['actions'][0],
): SiteConfig['site']['actions'][0] {
  let { url: filePath } = action;
  if (!action.static || !filePath) return action;
  if (!fs.existsSync(filePath)) {
    // Look in the local public path
    filePath = path.join('public', filePath);
  }
  if (!fs.existsSync(filePath))
    throw new Error(`Could not find static resource at "${action.url}". See 'config.web.actions'`);
  // Get rid of the first public path if present
  const parts = filePath.split(path.sep).filter((s, i) => i > 0 || s !== 'public');
  const webUrl = parts.join('/');
  session.log.debug(`Copying static resource from "${filePath}" to be available at "/${webUrl}"`);
  fs.copyFileSync(filePath, path.join(publicPath(opts), ...parts));
  return {
    title: action.title,
    url: `/${webUrl}`,
    static: true,
  };
}

function getRepeats<T>(things: T[]): Set<T> {
  const set = new Set<T>();
  const repeats = new Set<T>();
  things.forEach((thing) => {
    if (set.has(thing)) repeats.add(thing);
    set.add(thing);
  });
  return repeats;
}

function getSections(
  session: ISession,
  opts: Options,
  sections: WebConfig['sections'] = [],
): Pick<WebConfig, 'sections'> & Pick<SiteConfig, 'folders'> {
  if (sections.length === 0) {
    session.log.warn('There are no sections defined for the site.');
    return { sections: [], folders: {} };
  }
  const validated = sections.map((sec, index) => {
    if (!sec.title || !sec.folder)
      throw new Error(`Section ${index}: must have 'folder' and 'title' See 'config.web.sections'`);
    if (!fs.existsSync(sec.folder))
      throw new Error(`Could not find section "${sec.folder}". See 'config.web.sections'`);
    return { title: sec.title, folder: path.basename(sec.folder), path: sec.folder };
  });
  const repeatedBasnames = getRepeats(validated.map((s) => s.folder));
  if (repeatedBasnames.size > 0) {
    const array = [...repeatedBasnames].join('", "');
    throw new Error(`Section folder basenames must be unique. Repeated: ["${array}"].`);
  }
  const folders = Object.fromEntries(
    validated.map((sec): [string, SiteFolder] => {
      const filename = path.join(sec.path, '_toc.yml');
      if (!fs.existsSync(filename))
        throw new Error(`Could not find TOC "${filename}". Please create a '_toc.yml'.`);
      const toc = readTOC(session, { filename });
      const pages: Page[] = [];
      if (toc.chapters) {
        chaptersToPages(sec.path, toc.chapters, pages);
      } else if (toc.parts) {
        toc.parts.forEach((part, index) => {
          if (part.caption) {
            pages.push({ title: part.caption || `Part ${index + 1}`, level: 1 });
          }
          if (part.chapters) {
            chaptersToPages(sec.path, part.chapters, pages, 2);
          }
        });
      }
      return [sec.folder, { title: sec.title, index: toc.root, pages }];
    }),
  );
  return { sections: validated, folders };
}

function createConfig(session: ISession, opts: Options): Required<SiteConfig> {
  const { config } = session;
  if (!config) {
    throw new Error(
      `Could not find ${CURVENOTE_YML}. Use the \`--config [path]\` to override the default.`,
    );
  }
  const { sections, folders } = getSections(session, opts, config.web.sections);
  const design: Required<SiteConfig['site']['design']> = {
    hide_authors: config.web.design?.hide_authors ?? false,
  };
  const actions = (config.web.actions ?? []).map((action) =>
    copyActionResource(session, opts, action),
  );
  const site: Required<SiteConfig['site']> = {
    name: config.web.name || 'My Site',
    actions,
    favicon: config.web.favicon || null,
    logo: copyLogo(session, opts, config.web.logo) || null,
    logoText: config.web.logoText || null,
    twitter: config.web.twitter || null,
    domains: config.web.domains ?? [],
    nav: config.web.nav ?? [],
    sections,
    design,
  };
  return {
    site,
    folders,
  };
}

export async function readConfig(session: ISession, opts: Options): Promise<SiteConfig> {
  session.loadConfig(); // Ensure that this is the most up to date config
  const config = createConfig(session, opts);
  return config;
}
