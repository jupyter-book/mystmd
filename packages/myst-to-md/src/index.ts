import type { Root } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { Options } from 'mdast-util-to-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';
import { roleHandlers } from './roles';

const plugin: Plugin<[], Root, VFile> = function () {
  this.Compiler = (node, file) => {
    const options: Options = {
      fences: true,
      rule: '-',
      handlers: {
        ...roleHandlers,
      },
    };
    file.result = toMarkdown(node as any, options).trim();
    return file;
  };

  return (node: Root) => {
    // Preprocess
    return node;
  };
};

export default plugin;
