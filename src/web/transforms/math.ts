import katex from 'katex';
import { Math, InlineMath } from 'myst-spec';
import { selectAll } from 'mystjs';
import { Root } from './types';
import { Logger } from '../../logging';
import { Frontmatter } from '../../types';

export function renderEquation(log: Logger, node: Math | InlineMath, frontmatter: Frontmatter) {
  const { value } = node;
  if (!value) return;
  const displayMode = node.type === 'math';
  const label = 'label' in node ? `${node.type}.${node.label}` : node.type;
  const macros = frontmatter.math ?? {};
  try {
    (node as any).html = katex.renderToString(value, {
      displayMode,
      macros: { ...macros },
      strict: (f: string, m: string) =>
        log.warn(`Math Warning: [${label}]: ${f}, ${m}\n\n${node.value}\n`),
    });
  } catch (error) {
    const { message } = error as unknown as Error;
    log.error(`Math Error: [${label}]: ${message}\n\n${node.value}\n`);
    (node as any).error = true;
    (node as any).message = message;
  }
}

export function transformMath(log: Logger, mdast: Root, frontmatter: Frontmatter) {
  const nodes = selectAll('math,inlineMath', mdast) as (Math | InlineMath)[];
  nodes.forEach((node) => {
    renderEquation(log, node, frontmatter);
  });
}
