import type { Block } from 'myst-spec-ext';
import type { ISession } from '../index.js';
import { parseMyst } from '../index.js';
import type { GenericParent } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';

export function frontmatterPartsTransform(
  session: ISession,
  file: string,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
) {
  if (!frontmatter.parts) return;
  const partBlocks = Object.entries(frontmatter.parts).map(([part, content]) => {
    const data = { part, hidden: true };
    const root = parseMyst(session, content, file);
    return {
      type: 'block',
      data,
      children: root.children,
    } as Block;
  });
  mdast.children = [...partBlocks, ...mdast.children];
  delete frontmatter.parts;
}
