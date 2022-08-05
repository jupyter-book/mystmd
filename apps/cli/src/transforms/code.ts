import { selectAll } from 'mystjs';
import type { Code } from 'myst-spec';
import type { PageFrontmatter } from '../frontmatter/types';
import type { Root } from '../myst';
import type { ISession } from '../session/types';
import { addWarningForFile } from '../utils';

export function transformCode(
  session: ISession,
  file: string,
  mdast: Root,
  frontmatter?: PageFrontmatter,
) {
  const code = selectAll('code', mdast) as Code[];
  const { language: frontmatterLang } = frontmatter?.kernelspec || {};
  code.forEach((node) => {
    if (!node.lang) {
      if (!frontmatterLang) {
        addWarningForFile(session, file, 'Language is not defined for code block.');
        return;
      }
      node.lang = frontmatterLang;
    }
    if (node.lang.toLowerCase().includes('python')) {
      // captures ipython3 etc.
      node.lang = 'python';
    }
  });
}
