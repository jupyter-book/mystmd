import type {
  GenericNode,
  DirectiveData,
  DirectiveSpec,
  DirectiveContext,
  GenericParent,
} from 'myst-common';
import { RuleId, fileError, fileWarn } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import { contentFromNode, markChildrenAsProcessed } from './utils.js';
import type { Directive } from 'myst-spec';
import { parseOptions } from './inlineAttributes.js';

type MystDirectiveNode = GenericNode & {
  name: string;
  processed?: false;
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
  // Find all raw directive nodes, these will have a `processed` attribute set to `false`
  const nodes = selectAll('mystDirective[processed=false]', tree) as MystDirectiveNode[];
  nodes.forEach((node) => {
    const { name } = node;
    const spec = specLookup[name];
    if (spec && spec.body && spec.body.type !== 'myst') {
      // Do not process the children of the directive that is not a myst block
      // Doing so would raise errors (for example, if the parent directive is a code block)
      // See https://github.com/jupyter-book/mystmd/issues/2530
      markChildrenAsProcessed(node);
    }
    // Re-check if the directive has been processed
    if (node.processed !== false) return;
    delete node.processed; // Indicate that the directive has been processed
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
        const message = `required argument not provided for directive: ${name}`;
        fileError(vfile, message, { node, ruleId: RuleId.directiveArgumentCorrect });
        node.type = 'mystDirectiveError';
        node.message = message;
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
        node.args = data.arg;
      }
    } else if (argNode) {
      const message = `unexpected argument provided for directive: ${name}`;
      fileWarn(vfile, message, { node: argNode, ruleId: RuleId.directiveArgumentCorrect });
    }

    // Handle options
    // const options: Record<string, ParseTypes> = {};
    const { valid: validOptions, options } = parseOptions(name, node, vfile, optionsSpec);
    data.options = options;
    node.options = options;
    validationError = validationError || validOptions;

    // Handle body
    const bodyNode = node.children?.filter((c) => c.type === 'mystDirectiveBody')[0];
    if (bodySpec) {
      if (bodySpec.required && !bodyNode) {
        const message = `required body not provided for directive: ${name}`;
        fileError(vfile, message, { node, ruleId: RuleId.directiveBodyCorrect });
        node.type = 'mystDirectiveError';
        node.message = message;
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
        node.body = data.body;
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
    node.children = run(data, vfile, {
      // Implement a parseMyst function that accepts _relative_ line numbers
      parseMyst: (source: string, offset: number = 0) =>
        ctx.parseMyst(source, offset + node.position!.start.line),
    });
  });
}
