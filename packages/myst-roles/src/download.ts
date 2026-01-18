import type { RoleSpec } from 'myst-common';
import type { Link } from 'myst-spec';

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
    const link: Link = {
      type: 'link',
      url,
      static: true, // Indicate that this should be treated as a static download
      children: modified ? [{ type: 'text', value: modified.trim() }] : [],
    };
    return [link];
  },
};
