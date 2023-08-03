import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import katex from 'katex';
import type { Root } from 'mdast';
import type { Math, InlineMath, Node, Code } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';
import { copyNode, fileError, fileWarn, normalizeLabel } from 'myst-common';
import { unnestTransform } from './unnest.js';

const TRANSFORM_NAME = 'myst-transforms:math';

type Options = {
  macros?: Record<string, string>;
};

const replacements = {
  ' ': ' ',
};

const buildInMacros = {
  '\\mbox': '\\text{#1}', // mbox is not supported in KaTeX, this is an OK fallback
};

function transformMathValue(file: VFile, node: Math | InlineMath) {
  let { value } = node;
  if (!value) return undefined;
  Object.entries(replacements).forEach(([from, to]) => {
    value = value.replace(new RegExp(from, 'g'), to);
  });
  node.value = value;
}

function labelMathNodes(file: VFile, node: Math | InlineMath) {
  const { value } = node;
  if (!value) return;
  // Pull out all the labels from the latex
  const LABEL = /\\label\{([^}]+)\}/g;
  const match = LABEL.exec(value);
  if (!match) return value;
  const label = match[1];
  const normalized = normalizeLabel(label);
  if (node.type === 'math' && normalized) {
    if (node.enumerated === false) {
      fileWarn(file, `Labelling an unnumbered math node with "\\label{${label}}"`, {
        node,
        source: TRANSFORM_NAME,
      });
    }
    node.identifier = normalized.identifier;
    node.label = normalized.label;
    (node as any).html_id = normalized.html_id;
  } else if (node.type === 'inlineMath') {
    fileWarn(file, `Cannot use "\\label{${label}}" in inline math`, {
      node,
      source: TRANSFORM_NAME,
    });
  }
  node.value = value.replace(LABEL, '').trim();
}

function removeSimpleEquationEnv(file: VFile, node: Math | InlineMath) {
  const { value } = node;
  if (!value) return;
  // For simple equation environments, pull that out
  const BEGIN = /\\begin\{equation([*]?)\}/g;
  const END = /\\end\{equation([*]?)\}/g;
  if (value.match(BEGIN)?.length !== 1 || value.match(END)?.length !== 1) return;
  if (node.type === 'inlineMath') {
    fileWarn(file, `Unexpected AMS environment in inline math node.`, {
      node,
      note: value,
      source: TRANSFORM_NAME,
    });
    return;
  }
  const beginStar = BEGIN.exec(value)?.[1] === '*';
  const endStar = END.exec(value)?.[1] === '*';
  if (beginStar !== endStar) {
    // Should never get to here as the parser should not accept mismatched ends
    fileWarn(file, `Mismatching begin/end environment numbering`, {
      node,
      note: value,
      source: TRANSFORM_NAME,
    });
    return;
  }
  node.enumerated = !beginStar;
  node.value = value.replace(BEGIN, '').replace(END, '').trim();
}

function replaceEqnarray(file: VFile, value: string, node: Node) {
  if (!value.includes('\\begin{eqnarray}')) return value;
  fileWarn(file, 'Replacing \\begin{eqnarray} with \\begin{align*}', {
    node,
    note: 'Although the standard eqnarray environment is available in LaTeX, it is better to use align or equation+split instead. Within eqnarray, spacing around signs of relation is not the preferred mathematical spacing, and is inconsistent with that spacing as it appears in other environments.',
    source: TRANSFORM_NAME,
    url: 'http://anorien.csc.warwick.ac.uk/mirrors/CTAN/macros/latex/required/amsmath/amsldoc.pdf',
  });
  return value
    .replace(/\\begin{eqnarray}/g, '\\begin{align*}')
    .replace(/\\end{eqnarray}/g, '\\end{align*}')
    .replace(/&=&/g, '&=');
}

type RenderResult = { html?: string; warnings?: string[]; error?: string };

function removeWarnings(result: RenderResult, predicate: (warning: string) => boolean) {
  const { warnings, ...rest } = result;
  if (!warnings) return rest;
  const nextWarnings = warnings.filter(predicate);
  if (nextWarnings.length === 0) return rest;
  return {
    ...rest,
    warnings: nextWarnings,
  };
}

function tryRender(
  file: VFile,
  node: Node,
  value: string,
  macros: Record<string, any>,
): RenderResult {
  const displayMode = node.type === 'math';
  const warnings: string[] = [];
  try {
    const html = katex.renderToString(value, {
      displayMode,
      macros: { ...buildInMacros, ...macros },
      strict: (f: string, m: string) => {
        warnings.push(`${f}, ${m}`);
      },
    });
    if (warnings.length === 0) return { html };
    return { warnings, html };
  } catch (error) {
    const { message } = error as unknown as Error;
    if (message.includes("Expected 'EOF', got '&' at position")) {
      fileWarn(file, 'Wrapping with \\begin{align*}', {
        node,
        note: message,
        source: TRANSFORM_NAME,
      });
      const next = `\\begin{align*}\n${value}\n\\end{align*}`;
      const result = tryRender(file, node, next, macros);
      if (result.html) return result;
    }
    if (message.includes('Unknown column alignment: *')) {
      fileWarn(file, 'Alignment of "*" not supported, using "c"', {
        node,
        note: message,
        source: TRANSFORM_NAME,
      });
      const arrayCentering = /\\begin{array}{((?:\*\{[0-9]+\})c)}/g;
      if (value.match(arrayCentering)) {
        const next = value.replace(arrayCentering, '\\begin{array}{c}');
        const result = tryRender(file, node, next, macros);
        if (result.html) {
          // We expect, and remove some errors
          return removeWarnings(result, (w) => !w.includes('Too few columns specified'));
        }
      }
    }
    return { error: message.replace('KaTeX parse error: ', '') };
  }
}

function renderEquation(file: VFile, node: Math | InlineMath, opts?: Options) {
  let value = node.value;
  if (!value) {
    const message = 'No input for math node';
    fileWarn(file, message, {
      node,
      note: node.value,
      source: TRANSFORM_NAME,
      fatal: true,
    });
    (node as any).error = true;
    (node as any).message = message;
    return;
  }
  value = replaceEqnarray(file, value, node);
  const macros = opts?.macros ?? {};
  const result = tryRender(file, node, value, macros);
  if (result.html) {
    (node as any).html = result.html;
  }
  if (result.warnings) {
    result.warnings.forEach((message) => {
      fileWarn(file, message, { node, note: node.value, source: 'KaTeX' });
    });
  }
  if (result.error) {
    const nodeError = copyNode(node);
    const match = result.error.match(/position ([0-9]+):/);
    if (match && nodeError.position) {
      const offset = Number(match[1]);
      const lines = node.value.slice(0, offset).split('\n');
      const newLines = lines.length - 1;
      nodeError.position.start.line += newLines;
      if (newLines > 0) {
        nodeError.position.start.column = lines[newLines].length;
      } else {
        nodeError.position.start.column += offset - 1;
      }
    }
    fileError(file, result.error, { node: nodeError, note: node.value, source: 'KaTeX' });
    (node as any).error = true;
    (node as any).message = result.error;
  }
}

/**
 * Lift math from paragraphs. All information on the paragraph is copied (e.g. classes)
 *
 * ```
 * [ ..., {paragraph: [child1, math1, child2, child3, math2]}, ... ]
 * [ ..., {paragraph: [child1]}, math1, {paragraph: [child2, child3]}, math2, ... ]
 * ```
 *
 * @param tree
 * @param file
 */
export function mathNestingTransform(
  tree: Root,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  file: VFile,
) {
  unnestTransform(tree as GenericParent, 'paragraph', 'math');
}

export function mathLabelTransform(tree: Root, file: VFile) {
  const nodes = selectAll('math,inlineMath', tree) as (Math | InlineMath)[];
  nodes.forEach((node) => {
    transformMathValue(file, node);
    removeSimpleEquationEnv(file, node);
    labelMathNodes(file, node);
  });
}

export function mathTransform(tree: Root, file: VFile, opts?: Options) {
  const nodes = selectAll('math,inlineMath', tree) as (Math | InlineMath)[];
  nodes.forEach((node) => {
    renderEquation(file, node, opts);
  });
}

export const mathNestingPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  mathNestingTransform(tree, file);
};

export const mathLabelPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  mathLabelTransform(tree, file);
};

export const mathPlugin: Plugin<[Options?], Root, Root> = (opts) => (tree, file) => {
  mathTransform(tree, file, opts);
};
