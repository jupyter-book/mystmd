import type { Root } from 'myst-spec';
import type { Block, Code } from 'myst-spec-ext';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { PageFrontmatter } from 'myst-frontmatter';
import { writeMd } from 'myst-to-md';
import { select } from 'unist-util-select';

function markdownString(file: VFile, md_cells: Block[]) {
  const md = writeMd(file, { type: 'root', children: md_cells }).result as string;
  return {
    cell_type: 'markdown',
    metadata: {},
    source: md,
  };
}

export function writeIpynb(file: VFile, node: Root, frontmatter?: PageFrontmatter) {
  const cells = [];
  const md_cells: Block[] = [];

  for (const block of node.children as Block[]) {
    if (block.type === 'block' && block.kind === 'notebook-code') {
      if (md_cells.length != 0) {
        cells.push(markdownString(file, md_cells));
        md_cells.length = 0;
      }
      const code = select('code', block) as Code;
      cells.push({
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: code.value,
      });
    } else {
      md_cells.push(block);
    }
  }

  if (md_cells.length != 0) {
    cells.push(markdownString(file, md_cells));
    md_cells.length = 0;
  }

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
