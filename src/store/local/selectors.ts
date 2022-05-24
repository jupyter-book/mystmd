import { RootState } from '../reducers';

export function selectLocalProject(state: RootState, path: string) {
  return state.local.projects[path];
}

export function selectLocalSiteConfig(state: RootState) {
  return state.local.config.site;
}

export function selectLocalProjectConfig(state: RootState, path: string) {
  return state.local.config.projects[path];
}
