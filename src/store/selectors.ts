import {
  ProjectId,
  BlockId,
  VersionId,
  blockIdToString,
  versionIdToString,
} from '@curvenote/blocks';
import { RootState } from './reducers';

export function selectUser(state: RootState, userId: string) {
  return state.users[userId];
}

export function selectProject(state: RootState, projectId: ProjectId) {
  return state.projects[projectId];
}

export function selectBlock(state: RootState, blockId: BlockId) {
  const key = blockIdToString(blockId);
  return state.projects[key];
}

export function selectVersion(state: RootState, versionId: VersionId) {
  const key = versionIdToString(versionId);
  return state.projects[key];
}
