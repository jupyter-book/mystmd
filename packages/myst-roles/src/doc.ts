import type { RoleSpec } from 'myst-common';
import { fileWarn, RuleId } from 'myst-common';
import type { Link } from 'myst-spec';

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
        node: data.node,
        note: `For {doc}\`${body}\` use [${modified || ''}](${url})`,
        ruleId: RuleId.roleBodyCorrect,
      },
    );
    const link: Link = { type: 'link', url, children: [] };
    if (modified) link.children = [{ type: 'text', value: modified.trim() }];
    return [link];
  },
};
