import type { Root } from 'mdast';
import type { GenericNode, ArgDefinition, RoleData, RoleSpec } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';
import { select, selectAll } from 'unist-util-select';

type MystRoleNode = GenericNode & {
  name: string;
};

export function contentFromNode(node: GenericNode, spec: ArgDefinition) {
  const { children, value } = node;
  if (spec.type === ParseTypesEnum.parsed) {
    if (spec.required && !children?.length) {
      console.log(`error: no parsed content for required role`);
    }
    return children ?? [];
  }
  if (value == null) {
    if (spec.required) {
      console.log(`error: no content for required role`);
    }
    return undefined;
  }
  if (spec.type === ParseTypesEnum.string) {
    return String(value);
  }
  if (spec.type === ParseTypesEnum.number) {
    const valueAsNumber = Number(value);
    if (isNaN(valueAsNumber)) {
      console.log(`error: value not number`);
      return undefined;
    }
    return valueAsNumber;
  }
  if (spec.type === ParseTypesEnum.boolean) {
    return !!value;
  }
}

export function applyRoles(tree: Root, specs: RoleSpec[]) {
  const specLookup: Record<string, RoleSpec> = {};
  specs.forEach((spec) => {
    const names = [spec.name];
    if (spec.alias) {
      names.push(...(typeof spec.alias === 'string' ? [spec.alias] : spec.alias));
    }
    names.forEach((name) => {
      if (specLookup[name]) {
        console.log(`error: duplicate roles registered with name ${name}`);
      } else {
        specLookup[name] = spec;
      }
    });
  });
  const nodes = selectAll('mystRole', tree) as MystRoleNode[];
  nodes.forEach((node) => {
    const { name } = node;
    const spec = specLookup[name];
    if (!spec) {
      console.log(`error: unknown role ${name}`);
      // We probably want to do something better than just delete the children
      node.children = undefined;
      return;
    }
    const { body, validate, run } = spec;
    let data: RoleData = { name };
    const bodyNode = select('mystRoleBody', node) as GenericNode;
    if (body) {
      if (body.required && !bodyNode) {
        console.log(`error: role body required for role ${name}`);
      } else {
        data.body = contentFromNode(bodyNode, body);
      }
    } else if (bodyNode) {
      console.log(`warning: unexpected content for role ${name}`);
    }
    if (validate) {
      data = validate(data);
    }
    node.children = run(data);
  });
}
