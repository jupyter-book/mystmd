import { LocalProject, ProjectConfig, SiteConfig } from '../../types';
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
