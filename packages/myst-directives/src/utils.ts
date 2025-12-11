import {
  normalizeLabel,
  type DirectiveData,
  type DirectiveSpec,
  type GenericNode,
} from 'myst-common';

export function classDirectiveOption(nodeType = 'node') {
  return {
    class: {
      type: String,
      doc: `Annotate the ${nodeType} with a set of space-delimited class names.`,
    },
  };
}

export function labelDirectiveOption(nodeType = 'node') {
  return {
    label: {
      type: String,
      alias: ['name'],
      doc: `Label the ${nodeType} to be cross-referenced or explicitly linked to.`,
    },
  };
}

export function enumerationDirectiveOptions(nodeType = 'node'): Required<DirectiveSpec>['options'] {
  return {
    enumerated: {
      type: Boolean,
      alias: ['numbered'],
      doc: `Turn on/off the numbering for the specific ${nodeType}`,
    },
    enumerator: {
      type: String,
      alias: ['number'],
      doc: `Explicitly set the ${nodeType} number`,
    },
  };
}

/**
 * Adds `class`, `label`, `enumerated`, and `enumerator`.
 */
export function commonDirectiveOptions(nodeType = 'node'): Required<DirectiveSpec>['options'] {
  return {
    ...classDirectiveOption(nodeType),
    ...labelDirectiveOption(nodeType),
    ...enumerationDirectiveOptions(nodeType),
  };
}

export function addClassOptions(data: DirectiveData, node: GenericNode): GenericNode {
  if (typeof data.options?.class === 'string') {
    node.class = data.options.class;
  }
  return node;
}

export function addLabelOptions(data: DirectiveData, node: GenericNode): GenericNode {
  const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
  if (label) node.label = label;
  if (identifier) node.identifier = identifier;
  return node;
}

export function addEnumerationOptions(data: DirectiveData, node: GenericNode): GenericNode {
  if (typeof data.options?.enumerated === 'boolean') {
    node.enumerated = data.options.enumerated;
  }
  if (data.options?.enumerator) {
    node.enumerator = data.options.enumerator;
  }
  return node;
}

export function addCommonDirectiveOptions(data: DirectiveData, node: GenericNode) {
  addClassOptions(data, node);
  addLabelOptions(data, node);
  addEnumerationOptions(data, node);
  return node;
}
