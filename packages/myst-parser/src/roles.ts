import type { Root } from 'mdast';
import type { GenericNode, ArgDefinition, RoleData, RoleSpec } from 'myst-common';
import { fileError, fileWarn, ParseTypesEnum } from 'myst-common';
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
) {
  const { children, value } = node;
  if (spec.type === ParseTypesEnum.parsed) {
    if (!children?.length) {
      if (spec.required) {
        fileError(vfile, `no parsed content for required ${description}`, { node });
      }
      return undefined;
    }
    return children;
  }
  if (value == null) {
    if (spec.required) {
      fileError(vfile, `no content for required ${description}`, { node });
    }
    return undefined;
  }
  if (spec.type === ParseTypesEnum.string) {
    return String(value);
  }
  if (spec.type === ParseTypesEnum.number) {
    const valueAsNumber = Number(value);
    if (isNaN(valueAsNumber)) {
      const fileFn = spec.required ? fileError : fileWarn;
      fileFn(vfile, `number not provided for ${description}`, { node });
      return undefined;
    }
    return valueAsNumber;
  }
  if (spec.type === ParseTypesEnum.boolean) {
    return !!value;
  }
}

export function applyRoles(tree: Root, specs: RoleSpec[], vfile: VFile) {
  const specLookup: Record<string, RoleSpec> = {};
  specs.forEach((spec) => {
    const names = [spec.name];
    if (spec.alias) {
      names.push(...(typeof spec.alias === 'string' ? [spec.alias] : spec.alias));
    }
    names.forEach((name) => {
      if (specLookup[name]) {
        fileWarn(vfile, `duplicate roles registered with name: ${name}`);
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
      fileWarn(vfile, `unknown role: ${name}`, { node });
      // We probably want to do something better than just delete the children
      node.children = undefined;
      return;
    }
    const { body, validate, run } = spec;
    let data: RoleData = { name };
    let validationError = false;
    const bodyNode = select('mystRoleBody', node) as GenericNode;
    if (body) {
      if (body.required && !bodyNode) {
        fileError(vfile, `required body not provided for role: ${name}`, { node });
        node.type = 'mystRoleError';
        node.children = undefined;
        validationError = true;
      } else {
        data.body = contentFromNode(bodyNode, body, vfile, `body of role: ${name}`);
        if (body.required && data.body == null) {
          validationError = true;
        }
      }
    } else if (bodyNode) {
      fileWarn(vfile, `unexpected body provided for role: ${name}`, { node: bodyNode });
    }
    if (validationError) return;
    if (validate) {
      data = validate(data, vfile);
    }
    if (validationError) return;
    node.children = run(data, vfile);
  });
}
