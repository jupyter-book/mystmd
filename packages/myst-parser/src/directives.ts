import type { Root } from 'mdast';
import type { GenericNode, DirectiveData, DirectiveSpec, ParseTypes } from 'myst-common';
import { fileError, fileWarn } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import { contentFromNode } from './roles';

type MystDirectiveNode = GenericNode & {
  name: string;
};

export function applyDirectives(tree: Root, specs: DirectiveSpec[], vfile: VFile) {
  const specLookup: Record<string, DirectiveSpec> = {};
  specs.forEach((spec) => {
    const names = [spec.name];
    if (spec.alias) {
      names.push(...(typeof spec.alias === 'string' ? [spec.alias] : spec.alias));
    }
    names.forEach((name) => {
      if (specLookup[name]) {
        fileWarn(vfile, `duplicate directives registered with name: ${name}`);
      } else {
        specLookup[name] = spec;
      }
    });
  });
  const nodes = selectAll('mystDirective', tree) as MystDirectiveNode[];
  nodes.forEach((node) => {
    const { name } = node;
    const spec = specLookup[name];
    if (!spec) {
      fileWarn(vfile, `unknown directive: ${name}`, { node });
      // We probably want to do something better than just delete the children and
      // consolidate options back to value, but for now this gets myst-spec tests passing
      node.children = undefined;
      if (node.options) {
        const optionsString = Object.entries(node.options)
          .map(([key, val]) => {
            return `:${key}: ${val}`;
          })
          .join('\n');
        const value = node.value ? `\n\n${node.value}` : '';
        node.value = `${optionsString}${value}`;
        delete node.options;
      }
      return;
    }
    const { arg: argSpec, options: optionsSpec, body: bodySpec, validate, run } = spec;
    let data: DirectiveData = { name, options: {} };
    let validationError = false;
    // Handle arg
    const argNode = node.children?.filter((c) => c.type === 'mystDirectiveArg')[0];
    if (argSpec) {
      if (argSpec.required && !argNode) {
        fileError(vfile, `required argument not provided for directive: ${name}`, { node });
        node.type = 'mystDirectiveError';
        node.children = undefined;
        validationError = true;
      } else if (argNode) {
        data.arg = contentFromNode(argNode, argSpec, vfile, `argument of directive: ${name}`);
        if (argSpec.required && data.arg == null) {
          validationError = true;
        }
      }
    } else if (argNode) {
      fileWarn(vfile, `unexpected argument provided for directive: ${name}`, { node: argNode });
    }

    // Handle options
    const options: Record<string, ParseTypes> = {};
    const optionNodes = node.children?.filter((c) => c.type === 'mystDirectiveOption') ?? [];
    const optionNodeLookup: Record<string, GenericNode> = {};
    optionNodes.forEach((optionNode) => {
      if (optionNodeLookup[optionNode.name]) {
        fileWarn(vfile, `duplicate option "${optionNode.name}" declared for directive: ${name}`, {
          node: optionNode,
        });
      } else {
        optionNodeLookup[optionNode.name] = optionNode;
      }
    });
    Object.entries(optionsSpec || {}).forEach(([optionName, optionSpec]) => {
      const optionNode = optionNodeLookup[optionName];
      if (optionSpec.required && !optionNode) {
        fileError(vfile, `required option "${optionName}" not provided for directive: ${name}`, {
          node,
        });
        node.type = 'mystDirectiveError';
        node.children = undefined;
        validationError = true;
      } else if (optionNode) {
        const content = contentFromNode(
          optionNode,
          optionSpec,
          vfile,
          `option "${optionName}" of directive: ${name}`,
        );
        if (content != null) {
          options[optionName] = content;
        } else if (optionSpec.required) {
          validationError = true;
        }
        delete optionNodeLookup[optionName];
      }
    });
    Object.values(optionNodeLookup).forEach((optionNode) => {
      fileWarn(vfile, `unexpected option "${optionNode.name}" provided for directive: ${name}`, {
        node: optionNode,
      });
    });
    if (Object.keys(options).length) {
      data.options = options;
    }

    // Handle body
    const bodyNode = node.children?.filter((c) => c.type === 'mystDirectiveBody')[0];
    if (bodySpec) {
      if (bodySpec.required && !bodyNode) {
        fileError(vfile, `required body not provided for directive: ${name}`, { node });
        node.type = 'mystDirectiveError';
        node.children = undefined;
        validationError = true;
      } else if (bodyNode) {
        data.body = contentFromNode(bodyNode, bodySpec, vfile, `body of directive: ${name}`);
        if (bodySpec.required && data.body == null) {
          validationError = true;
        }
      }
    } else if (bodyNode) {
      fileWarn(vfile, `unexpected body provided for directive: ${name}`, { node: bodyNode });
    }
    if (validationError) return;
    if (validate) {
      data = validate(data, vfile);
    }
    if (validationError) return;
    node.children = run(data, vfile);
  });
}
