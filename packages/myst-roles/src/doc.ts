import type { RoleSpec } from 'myst-common';
import { fileWarn, ParseTypesEnum } from 'myst-common';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Document <doc>'

export const docRole: RoleSpec = {
  name: 'doc',
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data, vfile) {
    const body = data.body as string;
    const match = REF_PATTERN.exec(body);
    const [, modified, rawLabel] = match ?? [];
    const url = rawLabel ?? body;
    fileWarn(
      vfile,
      'Usage of the {doc} role is not recommended, use a markdown link to the file instead.',
      { source: 'role:doc', note: `For {doc}\`${body}\` use [${modified || ''}](${url})` },
    );
    return [
      {
        type: 'link',
        url,
        children: modified ? [{ type: 'text', value: modified.trim() }] : undefined,
      },
    ];
  },
};
