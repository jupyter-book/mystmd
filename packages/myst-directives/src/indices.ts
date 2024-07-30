import type { DirectiveSpec, DirectiveData, GenericNode, IndexTypeLists } from 'myst-common';
import { createIndexEntries, parseIndexLine } from 'myst-common';
import type { VFile } from 'vfile';

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
    if (data.options?.single) values.single.push(data.options.single as string);
    if (data.options?.pair) values.pair.push(data.options.pair as string);
    if (data.options?.triple) values.triple.push(data.options.triple as string);
    if (data.options?.see) values.see.push(data.options.see as string);
    if (data.options?.seealso) values.seealso.push(data.options.seealso as string);
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
  name: 'genindex',
  run(): GenericNode[] {
    return [{ type: 'genindex' }];
  },
};
