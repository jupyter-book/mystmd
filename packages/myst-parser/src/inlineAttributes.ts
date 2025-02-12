import type { GenericNode, OptionDefinition, ParseTypes } from 'myst-common';
import { fileError, fileWarn, RuleId } from 'myst-common';
import { type VFile } from 'vfile';
import { contentFromNode } from './utils.js';

export function parseOptions(
  name: string,
  node: GenericNode,
  vfile: VFile,
  optionsSpec?: Record<string, OptionDefinition>,
) {
  let validationError = false;
  // Handle options
  const options: Record<string, ParseTypes> = {};
  // Only look to the direct children here (i.e. for nested roles)
  const optionNodes = node.children?.filter((c) => c.type === 'mystOption') ?? [];
  const optionNodeLookup: Record<string, GenericNode> = {};
  optionNodes.forEach((optionNode) => {
    if (optionNode.name === 'id' && optionNode.location === 'inline') {
      // The ID maps to the label
      optionNodeLookup.label = optionNode;
      return;
    }
    if (optionNode.name === 'class') {
      if (optionNodeLookup.class) {
        // Combine the option class nodes
        // Note: This results in an position error for additional classes
        //       For example, pointing to a warning will always be the first class.
        //       That is fine for now.
        optionNodeLookup.class.value += ` ${optionNode.value}`;
      } else {
        optionNodeLookup.class = optionNode;
      }
      return;
    }
    if (optionNodeLookup[optionNode.name]) {
      fileWarn(vfile, `duplicate option "${optionNode.name}" declared (in ${name})`, {
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
        fileWarn(vfile, `option "${optionNameUsed}" used instead of "${alias}" (in ${name})`, {
          node,
          ruleId: RuleId.directiveOptionsCorrect,
        });
      }
      delete optionNodeLookup[alias];
    });

    if (optionSpec.required && !optionNode) {
      fileError(vfile, `required option "${optionName}" not provided (in ${name})`, {
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
        `option "${optionName}" (in ${name})`,
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
    fileWarn(vfile, `unexpected option "${optionNode.name}" provided (in ${name})`, {
      node: optionNode,
      ruleId: RuleId.directiveOptionsCorrect,
    });
  });
  return { valid: validationError, options: Object.keys(options).length ? options : undefined };
}
