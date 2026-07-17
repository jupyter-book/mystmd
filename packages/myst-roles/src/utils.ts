import { normalizeLabel, type RoleData, type RoleSpec, type GenericNode } from 'myst-common';

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

export function addClassOptions(data: RoleData, node: GenericNode): GenericNode {
  if (typeof data.options?.class === 'string') {
    node.class = data.options.class;
  }
  return node;
}

export function addLabelOptions(data: RoleData, node: GenericNode): GenericNode {
  const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
  if (label) node.label = label;
  if (identifier) node.identifier = identifier;
  return node;
}

export function addCommonRoleOptions(data: RoleData, node: GenericNode) {
  addClassOptions(data, node);
  addLabelOptions(data, node);
  return node;
}
