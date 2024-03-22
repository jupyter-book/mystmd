import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const wordCountRole: RoleSpec = {
  name: 'word-count',
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [
      {
        type: 'wordCount',
        value: data.body as string,
      },
    ];
  },
};
