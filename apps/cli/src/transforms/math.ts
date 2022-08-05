import chalk from 'chalk';
import katex from 'katex';
import type { Math, InlineMath } from 'myst-spec';
import { selectAll } from 'mystjs';
import type { ProjectFrontmatter } from '../frontmatter/types';
import type { Logger } from '../logging';
import type { Root } from '../myst';
import type { ISession } from '../session/types';
import { addWarningForFile } from '../utils';

const replacements = {
  ' ': ' ',
};

const buildInMacros = {
  '\\mbox': '\\text{#1}', // mbox is not supported in KaTeX, this is an OK fallback
};

function knownReplacements(log: Logger, node: Math | InlineMath, file: string): string | undefined {
  let { value } = node;
  if (!value) return undefined;
  Object.entries(replacements).forEach(([from, to]) => {
    value = value.replace(new RegExp(from, 'g'), to);
  });
  const LABEL = /\\label\{([^}]+)\}/g;
  const match = LABEL.exec(value);
  if (!match) return value;
  const label = match[1];
  log.debug(`Math: Replacing \\label for ${label} in ${file}`);
  if (node.type === 'math') {
    node.label = label;
    node.identifier = label; // TODO: normalizeLabel
  }
  return value.replace(LABEL, '');
}

function replaceEqnarray(log: Logger, value: string, file: string) {
  if (!value.includes('\\begin{eqnarray}')) return value;
  log.warn(
    `Math: Replacing \\begin{eqnarray} with \\begin{align*} in ${file}\n${chalk.dim(
      'Although the standard eqnarray environment is available in LaTeX, it is better to use align or equation+split instead. Within eqnarray, spacing around signs of relation is not the preferred mathematical spacing, and is inconsistent with that spacing as it appears in other environments.\n See http://anorien.csc.warwick.ac.uk/mirrors/CTAN/macros/latex/required/amsmath/amsldoc.pdf',
    )}`,
  );
  return value
    .replace(/\\begin{eqnarray}/g, '\\begin{align*}')
    .replace(/\\end{eqnarray}/g, '\\end{align*}');
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
  session: ISession,
  file: string,
  node: Math | InlineMath,
  frontmatter?: Pick<ProjectFrontmatter, 'math'>,
) {
  const { log } = session;
  let value = knownReplacements(log, node, file);
  if (!value) return;
  value = replaceEqnarray(log, value, file);
  const displayMode = node.type === 'math';
  const label = 'label' in node ? `${node.type}.${node.label}` : node.type;
  const macros = frontmatter?.math ?? {};
  const result = tryRender(log, value, macros, displayMode, file);
  if (result.html) {
    (node as any).html = result.html;
  }
  if (result.warnings) {
    addWarningForFile(
      session,
      file,
      `Math Warning [${label}]:\n${result.warnings.join('\n')}\n\n${node.value}\n`,
    );
  }
  if (result.error) {
    addWarningForFile(
      session,
      file,
      `Math Error [${label}]:\n${chalk.dim(`${result.error}\n\n${node.value}\n`)}`,
      'error',
    );
    (node as any).error = true;
    (node as any).message = result.error;
  }
}

export function transformMath(
  session: ISession,
  file: string,
  mdast: Root,
  frontmatter?: Pick<ProjectFrontmatter, 'math'>,
) {
  const nodes = selectAll('math,inlineMath', mdast) as (Math | InlineMath)[];
  nodes.forEach((node) => {
    renderEquation(session, file, node, frontmatter);
  });
}
