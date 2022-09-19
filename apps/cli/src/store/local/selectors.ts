import type { PartialSiteConfig } from '@curvenote/blocks';
import type { ProjectConfig } from '../../config/types';
import type { LocalProject, LocalProjectPage } from '../../toc/types';

import type { RootState } from '../reducers';

export function selectProjectConfig(state: RootState, path: string): ProjectConfig | undefined {
  return state.local.config.projects[path];
}

export function selectLocalProject(state: RootState, path: string): LocalProject | undefined {
  return state.local.projects[path];
}

export function selectAffiliation(state: RootState, id: string): string | undefined {
  return state.local.affiliations[id];
}

export function selectLocalSiteConfig(state: RootState): PartialSiteConfig | undefined {
  return state.local.config.site;
}

export function selectLocalRawConfig(
  state: RootState,
  path: string,
): Record<string, any> | undefined {
  return state.local.config.rawConfigs[path];
}

export function selectLocalProjectConfig(
  state: RootState,
  path: string,
): ProjectConfig | undefined {
  return state.local.config.projects[path];
}

export function selectFileInfo(state: RootState, path: string) {
  const { title, description, date, thumbnail, thumbnailOptimized, tags, sha256, url } =
    state.local.watch.files[path] ?? {};
  return { title, description, date, thumbnail, thumbnailOptimized, tags, sha256, url };
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

export function selectOxaLinkInformation(state: RootState, oxa: string) {
  const info = state.local.watch.linkLookup[oxa];
  if (!info) return undefined;
  const fileInfo = state.local.watch.files[info.path];
  return {
    title: fileInfo.title,
    description: fileInfo.description,
    url: info.url,
    thumbnail: fileInfo.thumbnail || undefined,
    thumbnailOptimized: fileInfo.thumbnailOptimized || undefined,
  };
}
