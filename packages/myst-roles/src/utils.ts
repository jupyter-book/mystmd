import { normalizeLabel, type RoleData, type RoleSpec } from 'myst-common';
import type { Content } from 'myst-spec';

export function classRoleOption(nodeType = 'node') {
  return {
    class: {
      type: String,
      doc: `Annotate the ${nodeType} with a set of space-delimited class names.`,
    },
  };
}

export function labelRoleOption(nodeType = 'node') {
  return {
    label: {
      type: String,
      alias: ['name'],
      doc: `Label the ${nodeType} to be cross-referenced or explicitly linked to.`,
    },
  };
}

/**
 * Adds `class`, `label`
 */
export function commonRoleOptions(nodeType = 'node'): Required<RoleSpec>['options'] {
  return {
    ...classRoleOption(nodeType),
    ...labelRoleOption(nodeType),
  };
}

// TODO: better types
export function addClassOptions<T extends Content>(data: RoleData, node: T): T {
  if (typeof data.options?.class === 'string') {
    node.class = data.options.class;
  }
  return node;
}

export function addLabelOptions<T extends Content>(data: RoleData, node: T): T {
  const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
  if (label) node.label = label;
  if (identifier) node.identifier = identifier;
  return node;
}

export function addCommonRoleOptions<T extends Content>(data: RoleData, node: T): T {
  addClassOptions(data, node);
  addLabelOptions(data, node);
  return node;
}
