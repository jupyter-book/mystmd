import type { Root } from 'mdast';
import type { GenericNode, DirectiveData, DirectiveSpec, ParseTypes } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import { contentFromNode } from './roles';

type MystDirectiveNode = GenericNode & {
  name: string;
};

export function applyDirectives(tree: Root, specs: DirectiveSpec[]) {
  const specLookup: Record<string, DirectiveSpec> = {};
  specs.forEach((spec) => {
    const names = [spec.name];
    if (spec.alias) {
      names.push(...(typeof spec.alias === 'string' ? [spec.alias] : spec.alias));
    }
    names.forEach((name) => {
      if (specLookup[name]) {
        console.log(`error: duplicate directives registered with name ${name}`);
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
      console.log(`error: unknown directive ${name}`);
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

    // Handle arg
    const argNode = select('mystDirectiveArg', node) as GenericNode;
    if (argSpec) {
      if (argSpec.required && !argNode) {
        console.log(`error: arg required for directive ${name}`);
      } else if (argNode) {
        data.arg = contentFromNode(argNode, argSpec);
      }
    } else if (argNode) {
      console.log(`warning: unexpected arg for directive ${name}`);
    }

    // Handle options
    const options: Record<string, ParseTypes> = {};
    const optionNodes = selectAll('mystDirectiveOption', node) as GenericNode[];
    const optionNodeLookup: Record<string, GenericNode> = {};
    optionNodes.forEach((optionNode) => {
      if (optionNodeLookup[optionNode.name]) {
        console.log(`warning: duplicate option declared with name ${optionNode.name}`);
      } else {
        optionNodeLookup[optionNode.name] = optionNode;
      }
    });
    Object.entries(optionsSpec || {}).forEach(([optionName, optionSpec]) => {
      const optionNode = optionNodeLookup[optionName];
      if (optionSpec.required && !optionNode) {
        console.log(`error: option ${optionName} required for directive ${name}`);
      } else if (optionNode) {
        const content = contentFromNode(optionNode, optionSpec);
        if (content != null) {
          options[optionName] = content;
        }
        delete optionNodeLookup[optionName];
      }
    });
    Object.keys(optionNodeLookup).forEach((optionName) => {
      console.log(`warning: extra option ${optionName} for directive ${name}`);
    });
    if (Object.keys(options).length) {
      data.options = options;
    }

    // Handle body
    const bodyNode = select('mystDirectiveBody', node) as GenericNode;
    if (bodySpec) {
      if (bodySpec.required && !bodyNode) {
        console.log(`error: body required for directive ${name}`);
      } else if (bodyNode) {
        data.body = contentFromNode(bodyNode, bodySpec);
      }
    } else if (bodyNode) {
      console.log(`warning: unexpected content for directive ${name}`);
    }

    if (validate) {
      data = validate(data);
    }
    node.children = run(data);
  });
}
