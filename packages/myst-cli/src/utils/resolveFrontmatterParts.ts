import type { FrontmatterParts } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';

/**
 * Load frontmatter parts from session and return part:node lookup
 */
export function resolveFrontmatterParts(
  session: ISession,
  pageFrontmatter?: PageFrontmatter,
): FrontmatterParts | undefined {
  const { parts } = pageFrontmatter ?? {};
  if (!parts || Object.keys(parts).length === 0) return undefined;
  const partsMdast: FrontmatterParts = {};
  Object.entries(parts).forEach(([part, content]) => {
    if (content.length !== 1) return;
    const { mdast, frontmatter } = castSession(session).$getMdast(content[0])?.post ?? {};
    if (mdast) partsMdast[part] = { mdast, frontmatter };
  });
  return partsMdast;
}
