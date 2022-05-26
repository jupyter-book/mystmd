import { LocalProject, LocalProjectPage, ProjectConfig, SiteConfig } from '../../types';
import { RootState } from '../reducers';

export function selectLocalProject(state: RootState, path: string): LocalProject | undefined {
  return state.local.projects[path];
}

export function selectLocalSiteConfig(state: RootState): SiteConfig | undefined {
  return state.local.config.site;
}

export function selectLocalProjectConfig(
  state: RootState,
  path: string,
): ProjectConfig | undefined {
  return state.local.config.projects[path];
}

export function selectFileInfo(state: RootState, path: string) {
  const { title, sha256 } = state.local.watch.files[path] ?? {};
  return { title, sha256 };
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
    // TODO: thumbnail
    thumbnail: undefined,
  };
}
