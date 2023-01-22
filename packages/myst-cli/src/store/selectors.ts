import { resolve } from 'path';
import type { LocalProject, LocalProjectPage } from '../project/types';
import type { RootState } from './reducers';
import type { BuildWarning, ExternalLinkResult } from './types';

export function selectLocalProject(state: RootState, path: string): LocalProject | undefined {
  return state.local.projects[resolve(path)];
}

export function selectAffiliation(state: RootState, id: string): string | undefined {
  return state.local.affiliations[id];
}

export function selectLocalSiteConfig(state: RootState, path: string) {
  return state.local.config.sites[resolve(path)];
}

export function selectCurrentSiteConfig(state: RootState) {
  if (!state.local.config.currentSitePath) return undefined;
  return state.local.config.sites[resolve(state.local.config.currentSitePath)];
}

export function selectCurrentSiteTemplateOptions(state: RootState) {
  if (!state.local.config.currentSitePath) return undefined;
  return state.local.config.siteTemplateOptions[resolve(state.local.config.currentSitePath)];
}

export function selectCurrentSitePath(state: RootState) {
  return state.local.config.currentSitePath;
}

export function selectCurrentSiteFile(state: RootState) {
  if (!state.local.config.currentSitePath) return undefined;
  return state.local.config.filenames[resolve(state.local.config.currentSitePath)];
}

export function selectLocalProjectConfig(state: RootState, path: string) {
  return state.local.config.projects[resolve(path)];
}

export function selectCurrentProjectConfig(state: RootState) {
  if (!state.local.config.currentProjectPath) return undefined;
  return state.local.config.projects[resolve(state.local.config.currentProjectPath)];
}

export function selectCurrentProjectPath(state: RootState) {
  return state.local.config.currentProjectPath;
}

export function selectCurrentProjectFile(state: RootState) {
  if (!state.local.config.currentProjectPath) return undefined;
  return state.local.config.filenames[resolve(state.local.config.currentProjectPath)];
}
export function selectLocalConfigFile(state: RootState, path: string) {
  return state.local.config.filenames[resolve(path)];
}

export function selectLocalRawConfig(
  state: RootState,
  path: string,
): Record<string, any> | undefined {
  return state.local.config.rawConfigs[resolve(path)];
}

export function selectFileInfo(state: RootState, path: string) {
  const {
    title,
    short_title,
    description,
    date,
    thumbnail,
    thumbnailOptimized,
    tags,
    sha256,
    url,
  } = state.local.watch.files[resolve(path)] ?? {};
  return {
    title,
    short_title,
    description,
    date,
    thumbnail,
    thumbnailOptimized,
    tags,
    sha256,
    url,
  };
}

export function selectPageSlug(state: RootState, projectPath: string, path: string) {
  const project = selectLocalProject(state, projectPath);
  if (!project) return undefined;
  if (path === project.file) return project.index;
  const found = project.pages
    .filter((page): page is LocalProjectPage => 'file' in page)
    .find(({ file }) => file === path);
  return found?.slug;
}

export function selectLinkStatus(state: RootState, url: string): ExternalLinkResult | undefined {
  return state.local.links[url];
}

export function selectFileWarnings(state: RootState, file: string): BuildWarning[] | undefined {
  return state.local.warnings[file];
}
