import type { FrontmatterParts, References } from 'myst-common';
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

/**
 * Load references from frontmatter part files
 *
 * Part content is rendered into exports, so citations that only appear in a
 * part must still reach the exported bibliography.
 */
export function resolveFrontmatterPartsReferences(
  session: ISession,
  pageFrontmatter?: PageFrontmatter,
): { references: References }[] {
  const { parts } = pageFrontmatter ?? {};
  if (!parts || Object.keys(parts).length === 0) return [];
  const partsReferences: { references: References }[] = [];
  Object.values(parts).forEach((content) => {
    if (content.length !== 1) return;
    const { references } = castSession(session).$getMdast(content[0])?.post ?? {};
    if (references) partsReferences.push({ references });
  });
  return partsReferences;
}
