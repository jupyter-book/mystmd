import { resolve } from 'node:path';
import type { ProjectConfig, SiteConfig } from 'myst-config';
import type { LocalProject, LocalProjectPage } from '../project/types.js';
import type { RootState } from './reducers.js';
import type { BuildWarning, ExternalLinkResult } from './types.js';

export function selectLocalProject(state: RootState, path: string): LocalProject | undefined {
  return state.local.projects[resolve(path)];
}

export function selectAffiliation(state: RootState, id: string): string | undefined {
  return state.local.affiliations[id];
}

export function selectLocalSiteConfig(state: RootState, path: string): ProjectConfig | undefined {
  return state.local.config.sites[resolve(path)];
}

export function selectCurrentSiteConfig(state: RootState): SiteConfig | undefined {
  if (!state.local.config.currentSitePath) return undefined;
  const config = state.local.config.sites[resolve(state.local.config.currentSitePath)];
  const path = selectCurrentProjectPath(state);
  if (config.projects || !path) return config;
  return { ...config, projects: [{ path }] };
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

export function selectLocalProjectConfig(
  state: RootState,
  path: string,
): ProjectConfig | undefined {
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
export function selectLocalConfigFile(state: RootState, path: string): string | undefined {
  return state.local.config.filenames[resolve(path)];
}

export function selectLocalRawConfig(
  state: RootState,
  path: string,
): Record<string, any> | undefined {
  return state.local.config.rawConfigs[resolve(path)];
}

export function selectReloadingState(state: RootState) {
  const { reloading, reloadRequested } = state.local.watch;
  return { reloading, reloadRequested };
}

export function selectFileInfo(state: RootState, path: string) {
  const {
    title,
    short_title,
    description,
    date,
    thumbnail,
    thumbnailOptimized,
    banner,
    bannerOptimized,
    tags,
    sha256,
    url,
    dataUrl,
  } = state.local.watch.files[resolve(path)] ?? {};
  return {
    title,
    short_title,
    description,
    date,
    thumbnail,
    thumbnailOptimized,
    banner,
    bannerOptimized,
    tags,
    sha256,
    url,
    dataUrl,
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

export function selectFileWarningsByRule(
  state: RootState,
  ruleId: string,
): (BuildWarning & { file: string })[] {
  const ruleWarnings: (BuildWarning & { file: string })[] = [];
  Object.entries(state.local.warnings).forEach(([file, warnings]) => {
    warnings.forEach((warning) => {
      if (warning.ruleId === ruleId) ruleWarnings.push({ file, ...warning });
    });
  });
  return ruleWarnings;
}
