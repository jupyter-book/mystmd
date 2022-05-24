import fs from 'fs';
import { parse, join } from 'path';
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

function fileInfo(file: string): { slug: string; title: string } {
  const slug = parse(file).name.toLowerCase();
  return { slug, title: slug };
}

export function projectPagesFromPath(
  path: string,
  level: pageLevels,
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
          ...fileInfo(file),
        } as LocalProjectPage;
      }
      const projectFolder = { title: fileInfo(file).title, level };
      const newLevel = level < 5 ? level + 1 : 6;
      const pages = projectPagesFromPath(file, newLevel as pageLevels, ignore);
      return pages.length ? [projectFolder].concat(pages) : [];
    })
    .flat();
}

export function projectFromPath(path: string, index?: string): LocalProject {
  if (!index) {
    fs.readdirSync(path).forEach((file) => {
      if (DEFAULT_INDEX_FILES.includes(file.toLowerCase())) {
        index = join(path, file);
      }
    });
  }
  if (!index || !fs.existsSync(index)) {
    throw Error(`index file ${index || DEFAULT_INDEX_FILES.join(',')} not found`);
  }
  const { title } = fileInfo(index);
  const pages = projectPagesFromPath(path, 1, [index, join(path, '_build')]);
  return { file: index, title, pages };
}

export function updateProject(store: Store<RootState>, path?: string, index?: string) {
  path = path || '.';
  const project = selectors.selectLocalProject(store.getState(), path);
  if (!index && project?.file) {
    index = project.file;
  }
  const newProject = projectFromPath(path, index);
  store.dispatch(projects.actions.recieve(newProject));
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
  const { title: projectTitle, pages } = proj;
  const manifestPages = pages.map((page) => {
    if ('file' in page) {
      const { slug, title, level } = page;
      return { slug, title, level };
    }
    return page;
  });
  return { slug: projectSlug, title: projectTitle, pages: manifestPages, ...frontmatter };
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
    siteProjects.push(localToManifestProject(proj, siteProj.url, frontmatter));
  });
  const { title, twitter, logo, logoText, nav, actions } = siteConfig;
  const manifest = {
    title,
    twitter,
    logo,
    logoText,
    nav,
    actions,
    projects: siteProjects,
  };
  return manifest;
}
