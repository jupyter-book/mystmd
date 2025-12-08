import { fileError, fileWarn, ParseTypesEnum } from 'myst-common';
import type { GenericNode, ArgDefinition, RuleId } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

export function contentFromNode(
  node: GenericNode,
  spec: ArgDefinition,
  vfile: VFile,
  description: string,
  ruleId: RuleId,
) {
  const { children, value } = node as any;
  if (spec.type === ParseTypesEnum.parsed || spec.type === 'myst') {
    if (typeof value !== 'string') {
      fileWarn(vfile, `content is parsed from non-string value for ${description}`, {
        node,
        ruleId,
      });
    }
    if (!children?.length) {
      if (spec.required) {
        fileError(vfile, `no parsed content for required ${description}`, { node, ruleId });
      }
      return undefined;
    }
    return children;
  }
  if (value == null) {
    if (spec.required) {
      fileError(vfile, `no content for required ${description}`, { node, ruleId });
    }
    return undefined;
  }
  if (spec.type === ParseTypesEnum.string || spec.type === String) {
    if (value === true) return '';
    // silently transform numbers into strings here
    if (typeof value !== 'string' && !(value && typeof value === 'number' && !isNaN(value))) {
      fileWarn(vfile, `value is not a string for ${description}`, { node, ruleId });
    }
    return String(value);
  }
  if (spec.type === ParseTypesEnum.number || spec.type === Number) {
    const valueAsNumber = Number(value);
    if (value === true || isNaN(valueAsNumber)) {
      const fileFn = spec.required ? fileError : fileWarn;
      fileFn(vfile, `number not provided for ${description}`, { node, ruleId });
      return undefined;
    }
    return valueAsNumber;
  }
  if (spec.type === ParseTypesEnum.boolean || spec.type === Boolean) {
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'false') return false;
      if (value.toLowerCase() === 'true') return true;
    }
    if (typeof value !== 'boolean') {
      fileWarn(vfile, `value is not a boolean for ${description}`, { node, ruleId });
    }
    return !!value;
  }
}

export function markChildrenAsProcessed(node: GenericNode) {
  const children = selectAll('mystDirective,mystRole', {
    type: 'root',
    children: node.children,
  }) as GenericNode[];
  children.forEach((child) => {
    delete child.processed;
  });
}
