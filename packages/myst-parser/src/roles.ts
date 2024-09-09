import type { GenericNode, ArgDefinition, RoleData, RoleSpec, GenericParent } from 'myst-common';
import { RuleId, fileError, fileWarn, ParseTypesEnum } from 'myst-common';
import type { Role } from 'myst-spec';
import { select, selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

type MystRoleNode = GenericNode & {
  name: string;
};

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

export function applyRoles(tree: GenericParent, specs: RoleSpec[], vfile: VFile) {
  const specLookup: Record<string, RoleSpec> = {};
  specs.forEach((spec) => {
    const names = [spec.name];
    if (spec.alias) {
      names.push(...(typeof spec.alias === 'string' ? [spec.alias] : spec.alias));
    }
    names.forEach((name) => {
      if (specLookup[name]) {
        fileWarn(vfile, `duplicate roles registered with name: ${name}`, {
          ruleId: RuleId.roleRegistered,
        });
      } else {
        specLookup[name] = spec;
      }
    });
  });
  const nodes = selectAll('mystRole[processed=false]', tree) as MystRoleNode[];
  nodes.forEach((node) => {
    delete node.processed; // Indicate that the role has been processed
    const { name } = node;
    const spec = specLookup[name];
    if (!spec) {
      fileError(vfile, `unknown role: ${name}`, { node, ruleId: RuleId.roleKnown });
      // We probably want to do something better than just delete the children
      delete node.children;
      return;
    }
    const { body, validate, run } = spec;
    let data: RoleData = { name, node: node as Role };
    let validationError = false;
    const bodyNode = select('mystRoleBody', node) as GenericNode;
    if (body) {
      if (body.required && !bodyNode) {
        fileError(vfile, `required body not provided for role: ${name}`, {
          node,
          ruleId: RuleId.roleBodyCorrect,
        });
        node.type = 'mystRoleError';
        delete node.children;
        validationError = true;
      } else {
        data.body = contentFromNode(
          bodyNode,
          body,
          vfile,
          `body of role: ${name}`,
          RuleId.roleBodyCorrect,
        );
        if (body.required && data.body == null) {
          validationError = true;
        }
      }
    } else if (bodyNode) {
      fileWarn(vfile, `unexpected body provided for role: ${name}`, {
        node: bodyNode,
        ruleId: RuleId.roleBodyCorrect,
      });
    }
    if (validationError) return;
    if (validate) {
      data = validate(data, vfile);
    }
    node.children = run(data, vfile);
  });
}
