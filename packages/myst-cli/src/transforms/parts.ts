import type { Block } from 'myst-spec-ext';
import type { ISession } from '../session/types.js';
import { parseMyst } from '../process/myst.js';
import type { GenericParent } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';

/**
 * Parse frontmatter parts and prepend them as blocks to mdast children
 *
 * @deprecated frontmatter parts are now processed separately by MyST
 */
export function frontmatterPartsTransform(
  session: ISession,
  file: string,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
) {
  if (!frontmatter.parts) return;
  const blocks = Object.entries(frontmatter.parts)
    .map(([part, contents]) => {
      const data = { part };
      return contents.map((content) => {
        const root = parseMyst(session, content, file);
        return {
          type: 'block',
          data,
          visibility: 'remove',
          children: root.children,
        } as Block;
      });
    })
    .flat();
  mdast.children = [...blocks, ...mdast.children];
  delete frontmatter.parts;
}
