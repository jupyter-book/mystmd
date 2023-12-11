import type { GenericNode, RoleSpec } from 'myst-common';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Download <file.zip>'

export const downloadRole: RoleSpec = {
  name: 'download',
  body: {
    type: String,
    required: true,
  },
  run(data) {
    const body = data.body as string;
    const match = REF_PATTERN.exec(body);
    const [, modified, rawLabel] = match ?? [];
    const url = rawLabel ?? body;
    const link: GenericNode = {
      type: 'link',
      url,
      static: true, // Indicate that this should be treated as a static download
    };
    if (modified) link.children = [{ type: 'text', value: modified.trim() }];
    return [link];
  },
};
