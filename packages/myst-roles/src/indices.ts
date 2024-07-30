import type { GenericNode, RoleSpec, IndexTypeLists } from 'myst-common';
import { parseIndexLine, createIndexEntries } from 'myst-common';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'index entries <pair: index; entry>'

export const indexRole: RoleSpec = {
  name: 'index',
  body: {
    type: String,
    required: true,
  },
  run(data, vfile) {
    const body = data.body as string;
    const match = REF_PATTERN.exec(body);
    const [, modified, indexString] = match ?? [];
    const values: IndexTypeLists = { single: [], pair: [], triple: [], see: [], seealso: [] };
    parseIndexLine(indexString ?? body, values, vfile, data.node);
    const entries = createIndexEntries(values, vfile, data.node);
    const output: GenericNode[] = [
      {
        type: 'mystTarget',
        indexEntries: entries,
      },
      {
        type: 'span',
        children: [
          {
            type: 'text',
            value: modified ?? body,
          },
        ],
      },
    ];
    return output;
  },
};
