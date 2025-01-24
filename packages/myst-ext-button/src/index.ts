import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import type { Link } from 'myst-spec-ext';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/;

export const buttonRole: RoleSpec = {
  name: 'button',
  doc: 'Button element with an action to navigate to internal or external links.',
  body: {
    type: String,
    doc: 'The body of the button.',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const body = data.body as string;
    const match = REF_PATTERN.exec(body);
    const [, modified, rawLabel] = match ?? [];
    const url = rawLabel ?? body;
    const node: Link = {
      type: 'link',
      url,
      children: [],
      class: 'button', // TODO: allow users to extend this
    };
    if (modified) node.children = [{ type: 'text', value: modified.trim() }];
    return [node];
  },
};
