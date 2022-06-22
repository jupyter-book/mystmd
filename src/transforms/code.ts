import { selectAll } from 'mystjs';
import { Code } from 'myst-spec';
import { PageFrontmatter } from '../frontmatter/types';
import { Root } from '../myst';

export function transformCode(mdast: Root, frontmatter?: PageFrontmatter) {
  const code = selectAll('code', mdast) as Code[];
  const { language: frontmatterLang } = frontmatter?.kernelspec || {};
  code.forEach((node) => {
    if (!node.lang) {
      if (!frontmatterLang) return;
      node.lang = frontmatterLang;
    }
    if (node.lang.toLowerCase().includes('python')) {
      // captures ipython3 etc.
      node.lang = 'python';
    }
  });
}
