import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const mathRole: RoleSpec = {
  name: 'math',
  doc: 'Render inline mathematical expressions. See [](#role:inline-math).',
  options: {
    ...commonRoleOptions('math'),
    typst: {
      type: String,
      doc: 'Typst-specific math content. If not provided, LaTeX content will be converted to Typst.',
    },
  },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const node: GenericNode = { type: 'inlineMath', value: data.body as string };
    addCommonRoleOptions(data, node);
    if (data.options?.typst) {
      node.typst = data.options.typst as string;
    }
    return [node];
  },
};
