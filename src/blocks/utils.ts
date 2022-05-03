import { SrcId } from './types';
import {
  BlockFrontMatterProps,
  ProjectFrontMatterProps,
  DEFAULT_BLOCK_FRONT_MATTER,
  DEFAULT_PROJECT_FRONT_MATTER,
} from './types/frontMatter';

export const srcIdToJson = (object: SrcId): SrcId => ({
  project: object.project,
  block: object.block,
  version: object.version ?? null,
  draft: object.draft ?? null,
});

const BLOCK_FRONT_MATTER_KEYS = Object.keys(
  DEFAULT_BLOCK_FRONT_MATTER,
) as (keyof BlockFrontMatterProps)[];

const PROJECT_FRONT_MATTER_KEYS = Object.keys(
  DEFAULT_PROJECT_FRONT_MATTER,
) as (keyof ProjectFrontMatterProps)[];

function extractFrontMatter<T extends BlockFrontMatterProps | ProjectFrontMatterProps>(
  keys: (keyof T)[],
  obj: T,
): T {
  const frontMatter: T = keys.reduce((acc, cur) => {
    const value = obj[cur];
    if (typeof value !== 'undefined' && value !== null) {
      (acc as any)[cur] = obj[cur];
    }
    return acc;
  }, {} as T);
  return frontMatter;
}

export function extractBlockFrontMatter(obj: BlockFrontMatterProps) {
  return extractFrontMatter(BLOCK_FRONT_MATTER_KEYS, obj);
}

export function extractProjectFrontMatter(obj: ProjectFrontMatterProps) {
  return extractFrontMatter(PROJECT_FRONT_MATTER_KEYS, obj);
}
