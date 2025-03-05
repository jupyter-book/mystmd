import type { Root } from 'myst-spec';
import type { Block, Code } from 'myst-spec-ext';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { PageFrontmatter } from 'myst-frontmatter';
import { writeMd } from 'myst-to-md';
import { select } from 'unist-util-select';

function sourceToStringList(src: string): string[] {
  const lines = src.split('\n').map((s) => `${s}\n`);
  lines[lines.length - 1] = lines[lines.length - 1].trimEnd();
  return lines;
}

export function writeIpynb(file: VFile, node: Root, frontmatter?: PageFrontmatter) {
  const cells = (node.children as Block[]).map((block: Block) => {
    if (block.type === 'block' && block.kind === 'notebook-code') {
      const code = select('code', block) as Code;
      return {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: sourceToStringList(code.value),
      };
    }
    const md = writeMd(file, { type: 'root', children: block.children as any }).result as string;
    return {
      cell_type: 'markdown',
      metadata: {},
      source: sourceToStringList(md),
    };
  });
  const ipynb = {
    cells,
    metadata: {
      language_info: {
        name: 'python',
      },
    },
    nbformat: 4,
    nbformat_minor: 2,
  };
  file.result = JSON.stringify(ipynb, null, 2);
  return file;
}

const plugin: Plugin<[PageFrontmatter?], Root, VFile> = function (frontmatter?) {
  this.Compiler = (node, file) => {
    return writeIpynb(file, node, frontmatter);
  };

  return (node: Root) => {
    // Preprocess
    return node;
  };
};

export default plugin;
