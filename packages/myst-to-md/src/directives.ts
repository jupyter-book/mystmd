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
function codeFence(node: any, _: Parent | undefined, state: NestedState, info: Info): string {
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
    argsKey?: string;
    keys?: string[];
    aliases?: Record<string, string>;
    transforms?: Record<string, (val: any) => string>;
  },
) {
  return (node: any, _: Parent | undefined, state: NestedState, info: Info): string => {
    const { argsKey, keys, aliases, transforms } = options || {};
    const args = argsKey && node[argsKey] ? ` ${node[argsKey]}` : '';
    const optionsLines = (keys ?? [])
      .filter((opt) => node[opt] != null && node[opt] !== false)
      .map((opt) => {
        const optString = `:${aliases?.[opt] ? aliases[opt] : opt}:`;
        const optValue = transforms?.[opt] ? transforms[opt](node[opt]) : node[opt];
        if (optValue === true) return optString;
        return `${optString} ${optValue}`;
      });
    const nodeCopy = { ...node };
    // Remove special properties that show up on codeFence first line.
    // If these are present on a node, they are still rendered as options.
    delete nodeCopy.meta;
    delete nodeCopy.lang;
    const valueLines = codeFence(nodeCopy, _, state, info).split('\n');
    if (optionsLines.length && valueLines.length > 2) optionsLines.push('');
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
  return writeStaticDirective(node.name, { argsKey: 'args' })(node, _, state, info);
}

/**
 * Override default code handler for code-block directive
 *
 * If the code node only has lang/meta/value, it falls back to
 * non-directive code fence.
 */
function code(node: any, _: Parent | undefined, state: NestedState, info: Info): string {
  const codeBlockKeys = [
    'class',
    'emphasizeLines',
    'label',
    'showLineNumbers',
    'startingLineNumber',
  ];
  const nodeCodeBlockKeys = Object.keys(node).filter((k) => codeBlockKeys.includes(k));
  if (!nodeCodeBlockKeys.length) return codeFence(node, _, state, info);
  const options = {
    keys: codeBlockKeys.concat('lang', 'meta'),
    aliases: {
      label: 'name',
      showLineNumbers: 'linenos',
      startingLineNumber: 'lineno-start',
      emphasizeLines: 'emphasize-lines',
    },
    transforms: {
      emphasizeLines: (val: number[]) => val.join(','),
    },
  };
  return writeStaticDirective('code-block', options)(node, _, state, info);
}

/**
 * Override default code handler for image directive
 *
 * If the image node only has url/title/alt, it falls back to
 * non-directive image.
 */
function image(node: any, _: Parent | undefined, state: NestedState, info: Info): string {
  const imageDirectiveKeys = ['class', 'width', 'align'];
  const nodeImageDirectiveKeys = Object.keys(node).filter((k) => imageDirectiveKeys.includes(k));
  if (!nodeImageDirectiveKeys.length) return defaultHandlers.image(node, undefined, state, info);
  const options = {
    argsKey: 'url',
    keys: imageDirectiveKeys.concat('title', 'alt'),
  };
  return writeStaticDirective('image', options)(node, _, state, info);
}

// List table

// Admonitions

// Figure

// Dropdowns, mermaid, cards, grids, tabs...

export const directiveHandlers: Record<string, Handle> = {
  code,
  image,
  math: writeStaticDirective('math', { keys: ['label'] }),
  embed: writeStaticDirective('embed', { keys: ['label'] }),
  include: writeStaticDirective('include', { argsKey: 'file' }),
  mystDirective,
};
