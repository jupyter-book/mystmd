import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Code } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import { fileWarn } from 'myst-utils';
import type { VFile } from 'vfile';

type Options = {
  lang?: string;
  transformPython?: boolean;
};

export function codeTransform(mdast: Root, file: VFile, opts?: Options) {
  const code = selectAll('code', mdast) as Code[];
  code.forEach((node) => {
    if (!node.lang) {
      if (!opts?.lang) {
        fileWarn(file, 'Language is not defined for code block', { node });
        return;
      }
      node.lang = opts?.lang;
    }
    if (node.lang.toLowerCase().includes('python') && opts?.transformPython !== false) {
      // captures ipython3 etc.
      node.lang = 'python';
    }
  });
}

export const codePlugin: Plugin<[Options?], Root, Root> = (opts) => (tree, file) => {
  codeTransform(tree, file, opts);
};
