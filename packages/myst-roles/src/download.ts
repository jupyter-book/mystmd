import type { RoleSpec } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Download <file.zip>'

export const downloadRole: RoleSpec = {
  name: 'download',
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data) {
    const body = data.body as string;
    const match = REF_PATTERN.exec(body);
    const [, modified, rawLabel] = match ?? [];
    const url = rawLabel ?? body;
    return [
      {
        type: 'link',
        url,
        children: modified ? [{ type: 'text', value: modified.trim() }] : undefined,
      },
    ];
  },
};
