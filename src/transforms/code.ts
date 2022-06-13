import { selectAll } from 'mystjs';
import { Code } from 'myst-spec';
import { Root } from '../myst';

export function transformCode(mdast: Root) {
  const code = selectAll('code', mdast) as Code[];
  code.forEach((node) => {
    const { lang } = node;
    if (!lang) return;
    if (lang.toLowerCase().includes('python')) {
      // captures ipython3 etc.
      node.lang = 'python';
    }
  });
}
