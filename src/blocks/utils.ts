import { SrcId } from './types';

export const srcIdToJson = (object: SrcId): SrcId => ({
  project: object.project,
  block: object.block,
  version: object.version ?? null,
  draft: object.draft ?? null,
});
