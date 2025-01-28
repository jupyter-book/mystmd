import type { VFile } from 'vfile';
import { type DirectiveSpec, type DirectiveData, type GenericNode, fileError } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

const CONTEXTS = ['project', 'page', 'section'];

export const tocDirective: DirectiveSpec = {
  name: 'toc',
  alias: ['tableofcontents', 'table-of-contents', 'toctree', 'contents'],
  arg: {
    type: 'myst',
    doc: 'Heading to be included with table of contents',
  },
  options: {
    context: {
      type: String,
      doc: 'Table of Contents context; one of project, page, or section',
      alias: ['kind'],
    },
    depth: {
      type: Number,
      doc: 'Number of levels to include in Table of Contents; by default, all levels will be included',
      alias: ['maxdepth'],
    },
    ...commonDirectiveOptions('toc'),
  },
  run(data: DirectiveData, vfile: VFile): GenericNode[] {
    let context = data.options?.context
      ? (data.options.context as string)
      : data.name === 'contents'
        ? 'section'
        : 'project';
    if (!CONTEXTS.includes(context)) {
      fileError(vfile, `Unknown context for ${data.name} directive: ${context}`);
      context = 'project';
    }
    let depth = data.options?.depth as number | undefined;
    if (depth != null && depth < 1) {
      fileError(vfile, `Table of Contents 'depth' must be a number greater than 0`);
      depth = undefined;
    }
    const children: GenericNode[] = [];
    if (data.arg) {
      const parsedArg = data.arg as GenericNode[];
      if (parsedArg[0]?.type === 'heading') {
        children.push(...parsedArg);
      } else {
        children.push({
          type: 'heading',
          depth: 2,
          enumerated: false,
          children: parsedArg,
        });
      }
    }
    const toc = { type: 'toc', kind: context, depth, children };
    addCommonDirectiveOptions(data, toc);
    return [toc];
  },
};
