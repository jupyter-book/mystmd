import type { RootState } from '../reducers';
import { BuildWarning, ExternalLinkResult } from './types';

export function selectLinkStatus(state: RootState, url: string): ExternalLinkResult | undefined {
  return state.build.links[url];
}

export function selectFileWarnings(state: RootState, file: string): BuildWarning[] | undefined {
  return state.build.warnings[file];
}
