import chalk from 'chalk';
import katex from 'katex';
import { Math, InlineMath } from 'myst-spec';
import { selectAll } from 'mystjs';
import { ProjectFrontmatter } from '../frontmatter/types';
import { Logger } from '../logging';
import { Root } from '../myst';

function replaceLabel(log: Logger, node: Math | InlineMath, file: string): string | undefined {
  if (!node.value) return undefined;
  const LABEL = /\\label\{([^}]+)\}/g;
  const match = LABEL.exec(node.value);
  if (!match) return node.value;
  const label = match[1];
  log.debug(`Replacing math \\label for ${label} in ${file}`);
  if (node.type === 'math') {
    node.label = label;
    node.identifier = label; // TODO: normalizeLabel
  }
  return node.value.replace(LABEL, '');
}

function replaceEqnarray(log: Logger, value: string, file: string) {
  if (!value.includes('\\begin{eqnarray}')) return value;
  log.warn(`Replacing math \\begin{eqnarray} with \\begin{align*} in ${file}`);
  return value
    .replace(/\\begin{eqnarray}/g, '\\begin{align*}')
    .replace(/\\end{eqnarray}/g, '\\end{align*}');
}

type RenderResult = { html?: string; warnings?: string[]; error?: string };

function removeWarnings(result: RenderResult, predicate: (warning: string) => boolean) {
  if (!result.warnings) return result;
  const nextWarnings = result.warnings.filter(predicate);
  if (nextWarnings.length === 0) return { html: result.html };
  return {
    ...result,
    warnings: nextWarnings,
  };
}

function tryRender(
  log: Logger,
  value: string,
  macros: Record<string, any>,
  displayMode: boolean,
  file: string,
): RenderResult {
  const warnings: string[] = [];
  try {
    const html = katex.renderToString(value, {
      displayMode,
      macros: { ...macros },
      strict: (f: string, m: string) => {
        warnings.push(`${f}, ${m}`);
      },
    });
    if (warnings.length === 0) return { html };
    return { warnings, html };
  } catch (error) {
    const { message } = error as unknown as Error;
    if (message.includes("Expected 'EOF', got '&' at position")) {
      log.warn(`Math: Wrapping with \\begin{align*} in ${file}\n${chalk.dim(message)}`);
      const result = tryRender(
        log,
        `\\begin{align*}\n${value}\n\\end{align*}`,
        macros,
        displayMode,
        file,
      );
      if (result.html) return result;
    }
    if (message.includes('Unknown column alignment: *')) {
      log.warn(`Math: Alignment of "*" not supported, using "c" in ${file}\n${chalk.dim(message)}`);
      const arrayCentering = /\\begin{array}{((?:\*\{[0-9]+\})c)}/g;
      if (value.match(arrayCentering)) {
        const next = value.replace(arrayCentering, '\\begin{array}{c}');
        const result = tryRender(log, next, macros, displayMode, file);
        if (result.html) {
          // We expect, and remove some errors
          return removeWarnings(result, (w) => !w.includes('Too few columns specified'));
        }
      }
    }
    return { error: message };
  }
}

export function renderEquation(
  log: Logger,
  node: Math | InlineMath,
  frontmatter: Pick<ProjectFrontmatter, 'math'>,
  file: string,
) {
  let value = replaceLabel(log, node, file);
  if (!value) return;
  value = replaceEqnarray(log, value, file);
  const displayMode = node.type === 'math';
  const label = 'label' in node ? `${node.type}.${node.label}` : node.type;
  const macros = frontmatter.math ?? {};
  const result = tryRender(log, value, macros, displayMode, file);
  if (result.html) {
    (node as any).html = result.html;
  }
  if (result.warnings) {
    log.warn(
      `Math Warning [${label}] in ${file}:\n${result.warnings.join('\n')}\n\n${node.value}\n`,
    );
  }
  if (result.error) {
    log.error(
      `Math Error [${label}] in ${file}:\n${chalk.dim(`${result.error}\n\n${node.value}\n`)}`,
    );
    (node as any).error = true;
    (node as any).message = result.error;
  }
}

export function transformMath(
  log: Logger,
  mdast: Root,
  frontmatter: Pick<ProjectFrontmatter, 'math'>,
  file: string,
) {
  const nodes = selectAll('math,inlineMath', mdast) as (Math | InlineMath)[];
  nodes.forEach((node) => {
    renderEquation(log, node, frontmatter, file);
  });
}
