import type { GenericNode, RoleData, RoleSpec, GenericParent } from 'myst-common';
import { RuleId, fileError, fileWarn } from 'myst-common';
import type { Role } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import { contentFromNode, markChildrenAsProcessed } from './utils.js';
import { parseOptions } from './inlineAttributes.js';

type MystRoleNode = GenericNode & {
  name: string;
  processed?: false;
};

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
  // Find all raw role nodes, these will have a `processed` attribute set to `false`
  const nodes = selectAll('mystRole[processed=false]', tree) as MystRoleNode[];
  nodes.forEach((node) => {
    const { name } = node;
    const spec = specLookup[name];
    if (spec && spec.body && spec.body.type !== 'myst') {
      // Do not process the children of the role that is not a myst block
      // Doing so would raise errors (for example, if the parent role is a cite)
      // See https://github.com/jupyter-book/mystmd/issues/2530
      markChildrenAsProcessed(node);
    }
    // Re-check if the role has been processed
    if (node.processed !== false) return;
    delete node.processed; // Indicate that the role has been processed
    if (!spec) {
      fileError(vfile, `unknown role: ${name}`, { node, ruleId: RuleId.roleKnown });
      // We probably want to do something better than just delete the children
      delete node.children;
      return;
    }
    const { body, options: optionsSpec, validate, run } = spec;
    let data: RoleData = { name, node: node as Role, options: {} };

    const { valid: validOptions, options } = parseOptions(name, node, vfile, optionsSpec);
    let validationError = validOptions;
    data.options = options;
    node.options = options;

    // Only look to the direct children
    const bodyNode = node.children?.find((n) => n.type === 'mystRoleBody') as GenericNode;
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
