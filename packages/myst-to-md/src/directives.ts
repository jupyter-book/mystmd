import type { Handle, Info } from 'mdast-util-to-markdown';
import type { Parent } from 'mdast';
import { defaultHandlers } from 'mdast-util-to-markdown';
import type { NestedState } from './types';
import { incrementNestedLevel, popNestedLevel } from './utils';

/**
 * Fenced code handler
 *
 * This extends the default code handler by incrementing the max directive nesting level.
 */
function code(node: any, _: Parent | undefined, state: NestedState, info: Info): string {
  const value = defaultHandlers.code(node, undefined, state, info);
  let inc = 1;
  while (value.startsWith('`'.repeat(inc + 3)) && value.endsWith('`'.repeat(inc + 3))) {
    inc += 1;
  }
  incrementNestedLevel('directive', state, inc);
  popNestedLevel('directive', state, inc);
  return value;
}

/**
 * Handler for any directive with a static value and options, not children
 */
function writeStaticDirective(
  name: string,
  options?: {
    keys: string[];
    aliases?: Record<string, string>;
    transforms?: Record<string, (val: any) => string>;
  },
) {
  return (node: any, _: Parent | undefined, state: NestedState, info: Info): string => {
    const args = node.args ? ` ${node.args}` : '';
    const optionsLines = options
      ? (options.keys ?? [])
          .filter((opt) => node[opt] == null || node[opt] === false)
          .map((opt) => {
            const optString = `:${options.aliases?.[opt] ? options.aliases[opt] : opt}:`;
            const optValue = options.transforms?.[opt]
              ? options.transforms[opt](node[opt])
              : node[opt];
            if (optValue === true) return optString;
            return `${optString} ${optValue}`;
          })
      : [];
    const valueLines = code(node, _, state, info).split('\n');
    const directiveLines = [
      `${valueLines[0]}{${name}}${args}`,
      ...optionsLines,
      ...valueLines.slice(1),
    ];
    return directiveLines.join('\n');
  };
}

/**
 * Generic MyST directive handler
 *
 * This uses the directive name/args/value and ignores any children nodes
 */
function mystDirective(node: any, _: Parent | undefined, state: NestedState, info: Info): string {
  return writeStaticDirective(node.name)(node, _, state, info);
}

// Math - static, with label

// code-block

// List table

// Admonitions

// Image

// Figure

// embed, include

// Dropdowns, mermaid, cards, grids, tabs...

export const directiveHandlers: Record<string, Handle> = {
  code,
  mystDirective,
};
