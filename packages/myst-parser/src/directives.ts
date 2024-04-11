import type {
  GenericNode,
  DirectiveData,
  DirectiveSpec,
  ParseTypes,
  GenericParent,
} from 'myst-common';
import { RuleId, fileError, fileWarn } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import { contentFromNode } from './roles.js';
import type { Directive } from 'myst-spec';

type MystDirectiveNode = GenericNode & {
  name: string;
};

export type DirectiveContext = {
  parseMyST: (source: string) => GenericParent;
};

/**
 * Apply directive `run()` methods to build directive ASTs.
 *
 * @param tree - raw MDAST containing mystDirectives
 * @param specs - record mapping from names to directive implementations
 * @param vfile
 */
export function applyDirectives(
  tree: GenericParent,
  specs: DirectiveSpec[],
  vfile: VFile,
  ctx: DirectiveContext,
) {
  // Record mapping from alias-or-name to directive spec
  const specLookup: Record<string, DirectiveSpec> = {};
  specs.forEach((spec) => {
    const names = [spec.name];
    // Wrap single-string `alias` fields as an array
    if (spec.alias) {
      names.push(...(typeof spec.alias === 'string' ? [spec.alias] : spec.alias));
    }
    names.forEach((name) => {
      if (specLookup[name]) {
        fileWarn(vfile, `duplicate directives registered with name: ${name}`, {
          ruleId: RuleId.directiveRegistered,
        });
      } else {
        specLookup[name] = spec;
      }
    });
  });
  // Find all raw directive nodes
  const nodes = selectAll('mystDirective', tree) as MystDirectiveNode[];
  nodes.forEach((node) => {
    const { name } = node;
    const spec = specLookup[name];
    if (!spec) {
      fileError(vfile, `unknown directive: ${name}`, { node, ruleId: RuleId.directiveKnown });
      // We probably want to do something better than just delete the children and
      // consolidate options back to value, but for now this gets myst-spec tests passing
      delete node.children;
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
    let data: DirectiveData = { name, node: node as Directive, options: {} };
    let validationError = false;
    // Handle arg
    const argNode = node.children?.filter((c) => c.type === 'mystDirectiveArg')[0];
    if (argSpec) {
      if (argSpec.required && !argNode) {
        fileError(vfile, `required argument not provided for directive: ${name}`, {
          node,
          ruleId: RuleId.directiveArgumentCorrect,
        });
        node.type = 'mystDirectiveError';
        delete node.children;
        validationError = true;
      } else if (argNode) {
        data.arg = contentFromNode(
          argNode,
          argSpec,
          vfile,
          `argument of directive: ${name}`,
          RuleId.directiveArgumentCorrect,
        );
        if (argSpec.required && data.arg == null) {
          validationError = true;
        }
      }
    } else if (argNode) {
      fileWarn(vfile, `unexpected argument provided for directive: ${name}`, {
        node: argNode,
        ruleId: RuleId.directiveArgumentCorrect,
      });
    }

    // Handle options
    const options: Record<string, ParseTypes> = {};
    const optionNodes = node.children?.filter((c) => c.type === 'mystDirectiveOption') ?? [];
    const optionNodeLookup: Record<string, GenericNode> = {};
    optionNodes.forEach((optionNode) => {
      if (optionNodeLookup[optionNode.name]) {
        fileWarn(vfile, `duplicate option "${optionNode.name}" declared for directive: ${name}`, {
          node: optionNode,
          ruleId: RuleId.directiveOptionsCorrect,
        });
      } else {
        optionNodeLookup[optionNode.name] = optionNode;
      }
    });

    // Deal with each option in the spec
    Object.entries(optionsSpec || {}).forEach(([optionName, optionSpec]) => {
      let optionNameUsed = optionName;
      let optionNode = optionNodeLookup[optionName];
      // Replace alias options or warn on duplicates
      optionSpec.alias?.forEach((alias) => {
        const aliasNode = optionNodeLookup[alias];
        if (!aliasNode) return;
        if (!optionNode && aliasNode) {
          optionNode = aliasNode;
          optionNameUsed = alias;
          optionNodeLookup[optionName] = optionNode;
        } else {
          fileWarn(
            vfile,
            `option "${optionNameUsed}" used instead of "${alias}" for directive: ${name}`,
            { node, ruleId: RuleId.directiveOptionsCorrect },
          );
        }
        delete optionNodeLookup[alias];
      });

      if (optionSpec.required && !optionNode) {
        fileError(vfile, `required option "${optionName}" not provided for directive: ${name}`, {
          node,
          ruleId: RuleId.directiveOptionsCorrect,
        });
        node.type = 'mystDirectiveError';
        delete node.children;
        validationError = true;
      } else if (optionNode) {
        const content = contentFromNode(
          optionNode,
          optionSpec,
          vfile,
          `option "${optionName}" of directive: ${name}`,
          RuleId.directiveOptionsCorrect,
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
        ruleId: RuleId.directiveOptionsCorrect,
      });
    });
    if (Object.keys(options).length) {
      data.options = options;
    }

    // Handle body
    const bodyNode = node.children?.filter((c) => c.type === 'mystDirectiveBody')[0];
    if (bodySpec) {
      if (bodySpec.required && !bodyNode) {
        fileError(vfile, `required body not provided for directive: ${name}`, {
          node,
          ruleId: RuleId.directiveBodyCorrect,
        });
        node.type = 'mystDirectiveError';
        delete node.children;
        validationError = true;
      } else if (bodyNode) {
        data.body = contentFromNode(
          bodyNode,
          bodySpec,
          vfile,
          `body of directive: ${name}`,
          RuleId.directiveBodyCorrect,
        );
        if (bodySpec.required && data.body == null) {
          validationError = true;
        }
      }
    } else if (bodyNode) {
      fileWarn(vfile, `unexpected body provided for directive: ${name}`, {
        node: bodyNode,
        ruleId: RuleId.directiveBodyCorrect,
      });
    }
    if (validationError) return;
    if (validate) {
      data = validate(data, vfile);
    }
    node.children = run(data, vfile, ctx);
  });
}
