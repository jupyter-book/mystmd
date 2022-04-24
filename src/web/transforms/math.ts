import katex from 'katex';
import { Math, InlineMath } from 'myst-spec';
import { selectAll } from 'mystjs';
import { Root, TransformState } from './types';

export function renderEquation(node: Math | InlineMath, state: TransformState) {
  const { value } = node;
  if (!value) return;
  const displayMode = node.type === 'math';
  const { log } = state.cache.session;
  const label = 'label' in node ? `${node.type}.${node.label}` : node.type;
  const macros = state.frontmatter.math ?? {};
  try {
    (node as any).html = katex.renderToString(value, {
      displayMode,
      macros: { ...macros },
      strict: (f: string, m: string) =>
        log.warn(`Math Warning: "${state.filename}[${label}]": ${f}, ${m}\n\n${node.value}\n`),
    });
  } catch (error) {
    const { message } = error as unknown as Error;
    log.error(`Math Error: "${state.filename}[${label}]": ${message}\n\n${node.value}\n`);
    (node as any).error = true;
    (node as any).message = message;
  }
}

export function transformMath(mdast: Root, state: TransformState) {
  const nodes = selectAll('math,inlineMath', mdast) as (Math | InlineMath)[];
  nodes.forEach((node) => {
    renderEquation(node, state);
  });
}
