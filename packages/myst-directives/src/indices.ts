import type { DirectiveSpec, DirectiveData, GenericNode, IndexTypeLists } from 'myst-common';
import { createIndexEntries, fileError, parseIndexLine } from 'myst-common';
import type { VFile } from 'vfile';

function warnOnOptionSyntax(option: string, value: string, vfile: VFile, node: GenericNode) {
  fileError(vfile, `Index entry definitions should not use :option: syntax`, {
    node,
    note: `Replace ":${option}: ${value}" with "${option}: ${value}"`,
  });
}

export const indexDirective: DirectiveSpec = {
  name: 'index',
  arg: {
    type: String,
  },
  options: {
    single: {
      type: String,
    },
    pair: {
      type: String,
    },
    triple: {
      type: String,
    },
    see: {
      type: String,
    },
    seealso: {
      type: String,
      alias: ['seeAlso', 'see-also'],
    },
    label: {
      type: String,
      alias: ['name'],
    },
  },
  body: {
    type: String,
  },
  run(data: DirectiveData, vfile: VFile): GenericNode[] {
    const values: IndexTypeLists = { single: [], pair: [], triple: [], see: [], seealso: [] };
    if (data.arg) parseIndexLine(data.arg as string, values, vfile, data.node);
    if (data.options?.single) {
      warnOnOptionSyntax('single', data.options.single as string, vfile, data.node);
      values.single.push(data.options.single as string);
    }
    if (data.options?.pair) {
      warnOnOptionSyntax('pair', data.options.pair as string, vfile, data.node);
      values.pair.push(data.options.pair as string);
    }
    if (data.options?.triple) {
      warnOnOptionSyntax('triple', data.options.triple as string, vfile, data.node);
      values.triple.push(data.options.triple as string);
    }
    if (data.options?.see) {
      warnOnOptionSyntax('see', data.options.see as string, vfile, data.node);
      values.see.push(data.options.see as string);
    }
    if (data.options?.seealso) {
      warnOnOptionSyntax('seealso', data.options.seealso as string, vfile, data.node);
      values.seealso.push(data.options.seealso as string);
    }
    if (data.body) {
      (data.body as string).split('\n').forEach((line) => {
        parseIndexLine(line, values, vfile, data.node);
      });
    }
    const entries = createIndexEntries(values, vfile, data.node);
    const output: GenericNode[] = [
      {
        type: 'mystTarget',
        label: data.options?.label as string | undefined,
        indexEntries: entries,
      },
    ];
    return output;
  },
};

export const genIndexDirective: DirectiveSpec = {
  name: 'show-index',
  alias: ['genindex'],
  arg: {
    type: 'myst',
    doc: 'Heading to be included in index block',
  },
  run(data): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      const parsedArg = data.arg as GenericNode[];
      if (parsedArg[0]?.type === 'heading') {
        children.push(...parsedArg);
      } else {
        children.push({
          type: 'heading',
          depth: 1,
          children: parsedArg,
        });
      }
    }

    return [{ type: 'genindex', children }];
  },
};
