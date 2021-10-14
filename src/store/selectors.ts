import {
  ProjectId,
  BlockId,
  VersionId,
  blockIdToString,
  versionIdToString,
  ALL_BLOCKS,
} from '@curvenote/blocks';
import { RootState } from './reducers';

export function selectUser(state: RootState, userId: string) {
  return state.users[userId];
}

export function selectTeam(state: RootState, teamId: string) {
  return state.teams[teamId];
}

export function selectProject(state: RootState, projectId: ProjectId) {
  return state.projects[projectId];
}

export function selectBlock(state: RootState, blockId: BlockId) {
  const key = blockIdToString(blockId);
  return state.blocks[key];
}

export function selectVersion<T extends ALL_BLOCKS = ALL_BLOCKS>(
  state: RootState,
  versionId: VersionId,
): T {
  const key = versionIdToString(versionId);
  return state.versions[key] as T;
}
