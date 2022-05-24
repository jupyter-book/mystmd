import fs from 'fs';
import { parse, join, sep } from 'path';
import { Store } from 'redux';
import { Frontmatter } from './config';
import { RootState, selectors } from './store';
import { projects } from './store/local';
import {
  SiteManifest,
  pageLevels,
  LocalProjectFolder,
  LocalProjectPage,
  LocalProject,
  SiteConfig,
  ProjectConfig,
  ManifestProject,
} from './types';

const DEFAULT_INDEX_FILES = ['readme.md'];
const VALID_FILE_EXTENSIONS = ['.md', '.ipynb'];

function isValidFile(file: string): boolean {
  return VALID_FILE_EXTENSIONS.includes(parse(file).ext);
}

function isDirectory(file: string): boolean {
  return fs.lstatSync(file).isDirectory();
}

function fileInfo(
  file: string,
  fileSlugs: Record<string, number>,
): { slug: string; title: string } {
  let slug = parse(file).name.toLowerCase();
  const title = slug;
  if (fileSlugs[slug]) {
    fileSlugs[slug] += 1;
    slug = `${slug}-${fileSlugs[slug] - 1}`;
  } else {
    fileSlugs[slug] = 1;
  }
  return { slug, title };
}

export function projectPagesFromPath(
  path: string,
  level: pageLevels,
  fileSlugs: Record<string, number>,
  ignore?: string[],
): (LocalProjectFolder | LocalProjectPage)[] {
  return fs
    .readdirSync(path)
    .map((file) => join(path, file))
    .filter((file) => !ignore || !ignore.includes(file))
    .filter((file) => isValidFile(file) || isDirectory(file))
    .sort()
    .map((file) => {
      if (isValidFile(file)) {
        return {
          file,
          level,
          ...fileInfo(file, fileSlugs),
        } as LocalProjectPage;
      }
      const projectFolder = { title: fileInfo(file, fileSlugs).title, level };
      const newLevel = level < 5 ? level + 1 : 6;
      const pages = projectPagesFromPath(file, newLevel as pageLevels, fileSlugs, ignore);
      return pages.length ? [projectFolder].concat(pages) : [];
    })
    .flat();
}

export function projectFromPath(path: string, indexFile?: string): LocalProject {
  if (!indexFile) {
    fs.readdirSync(path).forEach((file) => {
      if (DEFAULT_INDEX_FILES.includes(file.toLowerCase())) {
        indexFile = join(path, file);
      }
    });
  }
  if (!indexFile || !fs.existsSync(indexFile)) {
    throw Error(`index file ${indexFile || DEFAULT_INDEX_FILES.join(',')} not found`);
  }
  const fileSlugs: Record<string, number> = {};
  const { slug, title } = fileInfo(indexFile, fileSlugs);
  const pages = projectPagesFromPath(path, 1, fileSlugs, [indexFile, join(path, '_build')]);
  return { file: indexFile, index: slug, path, title, pages };
}

export function updateProject(store: Store<RootState>, path?: string, index?: string) {
  path = path || '.';
  const project = selectors.selectLocalProject(store.getState(), path);
  if (!index && project?.file) {
    index = project.file;
  }
  const newProject = projectFromPath(path, index);
  store.dispatch(projects.actions.receive(newProject));
}

export function resolveFrontmatter(
  siteConfig: SiteConfig,
  projectConfig?: ProjectConfig,
): Frontmatter {
  return {
    description: projectConfig?.description || siteConfig.description,
  };
}

export function localToManifestProject(
  proj: LocalProject,
  projectSlug: string,
  frontmatter: Frontmatter,
): ManifestProject {
  const { title: projectTitle, index, pages } = proj;
  const manifestPages = pages.map((page) => {
    if ('file' in page) {
      const { slug, title, level } = page;
      return { slug, title, level };
    }
    return page;
  });
  return { slug: projectSlug, index, title: projectTitle, pages: manifestPages, ...frontmatter };
}

export function getManifest(state: RootState): SiteManifest {
  const siteProjects: ManifestProject[] = [];
  const siteConfig = selectors.selectLocalSiteConfig(state);
  if (!siteConfig) throw Error('no site config defined');
  siteConfig.projects.forEach((siteProj) => {
    const projConfig = selectors.selectLocalProjectConfig(state, siteProj.path);
    const frontmatter = resolveFrontmatter(siteConfig, projConfig);
    const proj = selectors.selectLocalProject(state, siteProj.path);
    if (!proj) return;
    siteProjects.push(localToManifestProject(proj, siteProj.slug, frontmatter));
  });
  const { title, twitter, logo, logoText, nav, actions } = siteConfig;
  const manifest = {
    title: title || '',
    twitter,
    logo,
    logoText,
    nav,
    actions,
    projects: siteProjects,
  };
  return manifest;
}
