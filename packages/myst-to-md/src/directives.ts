import type { Handle, Info } from 'mdast-util-to-markdown';
import { defaultHandlers } from 'mdast-util-to-markdown';
import type { GenericNode } from 'myst-common';
import { fileError } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { NestedState, Parent, Validator } from './types';
import { incrementNestedLevel, popNestedLevel } from './utils';

type DirectiveOptions = {
  argsKey?: string;
  keys?: string[];
  aliases?: Record<string, string>;
  transforms?: Record<string, (val: any) => string>;
};

/**
Colons are used for directives which may have:
  - roles in the argument
  - nested directives in the body

Backticks are still used for code fences and directives with unparsed args/body
*/
const directiveChar = ':';

function argsFromNode(node: any, options?: DirectiveOptions) {
  const { argsKey } = options || {};
  return argsKey && node[argsKey] ? node[argsKey] : '';
}

function optionsFromNode(node: any, options?: DirectiveOptions) {
  const { keys, aliases, transforms } = options || {};
  const optionsLines = (keys ?? [])
    .filter((opt) => node[opt] != null && node[opt] !== false)
    .map((opt) => {
      const optString = `:${aliases?.[opt] ? aliases[opt] : opt}:`;
      const optValue = transforms?.[opt] ? transforms[opt](node[opt]) : node[opt];
      if (optValue === true) return optString;
      return `${optString} ${optValue}`;
    });
  return optionsLines;
}

/**
 * Handler for any directive with a static args, options, and value, not children
 */
function writeStaticDirective(name: string, options?: DirectiveOptions) {
  return (node: any, _: Parent, state: NestedState, info: Info): string => {
    const args = argsFromNode(node, options);
    const optionsLines = optionsFromNode(node, options);
    const nodeCopy = { ...node };
    // Remove special properties that show up on codeFence first line.
    // If these are present on a node, they are still rendered as options.
    delete nodeCopy.meta;
    delete nodeCopy.lang;
    const valueLines = defaultHandlers.code(nodeCopy, _, state, info).split('\n');
    if (optionsLines.length && valueLines.length > 2) optionsLines.push('');
    const directiveLines = [
      `${valueLines[0]}{${name}}${args ? ' ' : ''}${args}`,
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
function mystDirective(node: any, _: Parent, state: NestedState, info: Info): string {
  return writeStaticDirective(node.name, { argsKey: 'args' })(node, _, state, info);
}

/**
 * Override default code handler for code-block directive
 *
 * If the code node only has lang/meta/value, it falls back to
 * non-directive code fence.
 */
function code(node: any, _: Parent, state: NestedState, info: Info): string {
  const codeBlockKeys = [
    'class',
    'emphasizeLines',
    'label',
    'showLineNumbers',
    'startingLineNumber',
  ];
  const nodeCodeBlockKeys = Object.keys(node).filter((k) => codeBlockKeys.includes(k));
  if (!nodeCodeBlockKeys.length) {
    return defaultHandlers.code(node, _, state, info);
  }
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

const IMAGE_DIRECTIVE_OPTS = ['class', 'width', 'align'];
const IMAGE_OPTS = IMAGE_DIRECTIVE_OPTS.concat('title', 'alt');

/**
 * Override default code handler for image directive
 *
 * If the image node only has url/title/alt, it falls back to
 * non-directive image.
 */
function image(node: any, _: Parent, state: NestedState, info: Info): string {
  const nodeImageDirectiveKeys = Object.keys(node).filter((k) => IMAGE_DIRECTIVE_OPTS.includes(k));
  if (!nodeImageDirectiveKeys.length) return defaultHandlers.image(node, undefined, state, info);
  const options = {
    argsKey: 'url',
    keys: IMAGE_OPTS,
  };
  return writeStaticDirective('image', options)(node, _, state, info);
}

/**
 * Handler for any directive with children nodes
 *
 * This adds multiple backticks in cases where directives are nested
 */
function writeFlowDirective(name: string, args?: string, options?: DirectiveOptions) {
  return (node: any, _: Parent, state: NestedState, info: Info): string => {
    incrementNestedLevel('directive', state);
    const optionsLines = optionsFromNode(node, options);
    const content = state.containerFlow(node, info);
    const nesting = popNestedLevel('directive', state);
    const marker = directiveChar.repeat(nesting + 3);
    if (optionsLines.length && content) optionsLines.push('');
    const directiveLines = [`${marker}{${name}}${args ? ' ' : ''}${args}`, ...optionsLines];
    if (content) directiveLines.push(content);
    directiveLines.push(marker);
    return directiveLines.join('\n');
  };
}

function containerValidator(node: any, file: VFile) {
  const { kind } = node;
  if (kind === 'figure' && !select('image', node)) {
    fileError(file, 'Figure container must have image node child', { node, source: 'myst-to-md' });
  }
  if (kind === 'table' && !select('table', node)) {
    fileError(file, 'Table container must have table node child', { node, source: 'myst-to-md' });
  }
  if (kind !== 'figure' && kind !== 'table') {
    fileError(file, `Unknown kind on container node: ${kind}`, { node, source: 'myst-to-md' });
  }
}

const FIGURE_OPTS = ['label', 'class', 'width', 'align', 'title', 'alt'];
const TABLE_KEYS = ['headerRows', 'label', 'class', 'width', 'align'];

/**
 * Handler for container nodes
 */
function container(node: any, _: Parent, state: NestedState, info: Info): string {
  const captionNode: GenericNode | null = select('caption', node);
  const legendNode: GenericNode | null = select('legend', node);
  const children = [...(captionNode?.children || []), ...(legendNode?.children || [])];
  if (node.kind === 'figure') {
    const imageNode: GenericNode | null = select('image', node);
    if (!imageNode) return '';
    const combinedNode: Record<string, any> = { type: 'container', url: imageNode.url, children };
    FIGURE_OPTS.forEach((key) => {
      const val = node[key] ?? imageNode[key];
      if (val) combinedNode[key] = val;
    });
    const options = {
      argsKey: 'url',
      keys: FIGURE_OPTS,
      aliases: { label: 'name' },
    };
    const args = argsFromNode(combinedNode, options);
    return writeFlowDirective('figure', args, options)(combinedNode, _, state, info);
  } else if (node.kind === 'table') {
    const tableNode: GenericNode | null = select('table', node);
    if (!tableNode) return '';
    let headerRows = 0;
    let inHeader = true;
    const listNodes = selectAll('tableRow', tableNode).map((row) => {
      const cells = selectAll('tableCell', row);
      if (inHeader) {
        const isHeaderRow = cells
          .map((cell) => (cell as any).header)
          .reduce((val, allHeaders) => (val ? allHeaders : false), true);
        if (isHeaderRow) {
          headerRows += 1;
        } else {
          inHeader = false;
        }
      }
      const listItemNodes = cells.map((cell) => {
        return { ...cell, type: 'listItem' };
      });
      return {
        ...row,
        type: 'listItem',
        children: [{ type: 'list', children: listItemNodes }],
      };
    });
    const combinedNode: Record<string, any> = {
      type: 'container',
      headerRows,
      children: [{ type: 'list', children: listNodes }],
    };
    TABLE_KEYS.forEach((key) => {
      const val = node[key] ?? tableNode[key];
      if (val) combinedNode[key] = val;
    });
    const args = captionNode ? state.containerPhrasing(captionNode as any, info) : '';
    const options = {
      keys: TABLE_KEYS,
      aliases: {
        headerRows: 'header-rows',
        label: 'name',
      },
    };
    return writeFlowDirective('list-table', args, options)(combinedNode, _, state, info);
  }
  return '';
}

function admonition(node: any, _: Parent, state: NestedState, info: Info): string {
  const name = node.kind ?? 'admonition';
  const admonitionTitle = select('admonitionTitle', node);
  const args = admonitionTitle ? state.containerPhrasing(admonitionTitle as any, info) : '';
  const nodeCopyNoTitle = {
    ...node,
    children: node.children.filter((n: GenericNode) => n.type !== 'admonitionTitle'),
  };
  const options = {
    keys: ['class', 'icon'],
  };
  return writeFlowDirective(name, args, options)(nodeCopyNoTitle, _, state, info);
}

// Dropdowns, mermaid, cards, grids, tabs...

export const directiveHandlers: Record<string, Handle> = {
  code,
  image,
  container,
  admonition,
  math: writeStaticDirective('math', { keys: ['label'] }),
  embed: writeStaticDirective('embed', { keys: ['label'] }),
  include: writeStaticDirective('include', { argsKey: 'file' }),
  mystDirective,
};

export const directiveValidators: Record<string, Validator> = {
  container: containerValidator,
};
