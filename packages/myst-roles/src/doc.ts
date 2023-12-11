import type { GenericNode, RoleSpec } from 'myst-common';
import { fileWarn, RuleId } from 'myst-common';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Document <doc>'

export const docRole: RoleSpec = {
  name: 'doc',
  body: {
    type: String,
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
      {
        source: 'role:doc',
        note: `For {doc}\`${body}\` use [${modified || ''}](${url})`,
        ruleId: RuleId.roleBodyCorrect,
      },
    );
    const link: GenericNode = { type: 'link', url };
    if (modified) link.children = [{ type: 'text', value: modified.trim() }];
    return [link];
  },
};
