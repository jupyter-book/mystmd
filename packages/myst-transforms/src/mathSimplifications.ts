import type { Plugin } from 'unified';
import type { InlineMath } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';

type Options = {
  replaceText?: boolean;
  replaceSymbol?: boolean;
  replaceScripts?: boolean;
  replaceNumber?: boolean;
};

const TEXT_REPLACEMENTS: Record<string, string> = {
  '\\pm': '±',
  '\\circ': '∘',
  '\\degree': '°',
};

const SYM_REPLACEMENTS: Record<string, string> = {
  '\\star': '⋆',
  '\\times': '×',
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\Gamma': 'Γ',
  '\\gamma': 'γ',
  '\\Delta': 'Δ',
  '\\delta': 'δ',
  '\\epsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\Theta': 'Θ',
  '\\theta': 'θ',
  '\\vartheta': 'ϑ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\Lambda': 'Λ',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\Xi': 'Ξ',
  '\\xi': 'ξ',
  '\\Pi': 'Π',
  '\\pi': 'π',
  '\\rho': 'ρ',
  '\\Sigma': 'Σ',
  '\\sigma': 'σ',
  '\\tau': 'τ',
  '\\Upsilon': 'Υ',
  '\\upsilon': 'υ',
  '\\Phi': 'Φ',
  '\\phi': 'ϕ',
  '\\varphi': 'φ',
  '\\chi': 'χ',
  '\\Psi': 'Ψ',
  '\\psi': 'ψ',
  '\\Omega': 'Ω',
  '\\omega': 'ω',
  '\\partial': '∂',
  '\\infty': '∞',
  '\\propto': '∝',
  '\\iinfin': '⧜',
  '\\tieinfty': '⧝',
  '\\acidfree': '♾',
  '\\approx': '≈',
  '\\neq': '≠',
  '\\cdot': '•',
  '\\geq': '≥',
  '\\leq': '≤',
};

function getReplacement(symbol: string, options?: Options): undefined | string {
  // Return the single letter if available
  if (!symbol) return undefined;
  if (options?.replaceText !== false && symbol.match(/^([a-zA-Z]+)$/)) return symbol;
  if (options?.replaceNumber !== false && symbol.match(/^([0-9+-]+)$/)) return symbol;
  if (options?.replaceText !== false && TEXT_REPLACEMENTS[symbol]) return TEXT_REPLACEMENTS[symbol];
  if (options?.replaceSymbol !== false && SYM_REPLACEMENTS[symbol]) return SYM_REPLACEMENTS[symbol];
  return undefined;
}

/**
 * Replaces single symbols symbols:
 *  - `\pm`
 *  - `\star`
 *  - `\alpha`
 *
 * Uses the `REPLACEMENTS` list above.
 */
function replaceSymbol(node: InlineMath, options?: Options) {
  const match = node.value.match(/^(\\[a-zA-Z]+)$/);
  if (!match) return false;
  const text = getReplacement(match[1], options);
  if (!text) return false;
  (node as any).type = 'text';
  node.value = text;
  return true;
}

// function changeToEmph(node: GenericNode): Emphasis {
//   node.type = 'emphasis';
//   node.data = { 'specific-use': 'math' };
//   return node as Emphasis;
// }

// function replaceSubSuperScripts(node: InlineMath, vfile: VFile) {
//   const match = node.value.match(/^(\\?[a-zA-Z]+)(\^|_)(\\?[a-zA-Z]+)$/);
//   if (!match) return false;
//   const script = match[2] === '^' ? 'superscript' : 'subscript';
//   const first = getReplacement(match[1]);
//   const second = getReplacement(match[3]);
//   if (!first || !second) return false;
//   const emph = changeToEmph(node);
//   emph.children = [
//     { type: 'text', value: first },
//     { type: script, children: [{ type: 'text', value: second }] },
//   ] as any;
//   return true;
// }

// function replaceTextCommand(node: InlineMath, vfile: VFile) {
//   const match = node.value.match(/^\\text\{([a-zA-Z0-9-\s]+)}$/);
//   if (!match) return false;
//   const text = match[1];
//   if (!text) return false;
//   (node as any).type = 'text';
//   node.value = text;
//   return true;
// }

/**
 * Replaces hanging subscript and superscript numbers and symbols:
 *  - `_2`
 *  - `_{\alpha}`
 *  - `^{th}`
 */
function replaceDirectSubSuperScripts(node: InlineMath, options?: Options) {
  const match = node.value.match(/^(\^|_)(?:(?:\{(\\?[a-zA-Z0-9+-]+)\})|(\\?[a-zA-Z0-9+-]+))$/);
  if (!match) return false;
  const script = match[1] === '^' ? 'superscript' : 'subscript';
  const value = getReplacement(match[2] || match[3], options);
  if (!value) return false;
  if (value === '∘' && script === 'superscript') {
    (node as any).type = 'text';
    // Change a superscript circle to a degree
    node.value = '°';
    return true;
  }
  if (options?.replaceSymbol === false) return false;
  (node as any).type = script;
  (node as any).children = [{ type: 'text', value }];
  delete (node as any).value;
  return true;
}

/**
 * Replaces subscript and superscript numbers like:
 *  - `-10^{-4}`
 *  - `10^3`
 *  - `4.1_2`
 */
function replaceNumberedSubSuperScripts(node: InlineMath, options?: Options) {
  const match = node.value.match(/^([+-]?[\d.]+)(\^|_)(?:(?:\{([+-]?[\d.]+)\})|([+-]?[\d.]+))$/);
  if (!match) return false;
  const first = match[1];
  const second = match[3] || match[4];
  const script = match[2] === '^' ? 'superscript' : 'subscript';
  (node as any).type = 'span';
  (node as any).children = [
    { type: 'text', value: first },
    { type: script, children: [{ type: 'text', value: second }] },
  ];
  delete (node as any).value;
  return true;
}

/**
 * Replaces a simple number:
 *  - `-10.3`
 *  - `5`
 *  - `+30`
 */
function replaceNumber(node: InlineMath, options?: Options) {
  const match = node.value.match(/^([+-]?[0-9.]+)$/);
  if (!match) return false;
  const text = match[1];
  if (!text) return false;
  (node as any).type = 'text';
  node.value = text;
  return true;
}

export function inlineMathSimplificationTransform(mdast: GenericParent, options?: Options) {
  const math = selectAll('inlineMath', mdast) as InlineMath[];
  math.forEach((node) => {
    if (replaceSymbol(node, options)) {
      return;
    }
    if (options?.replaceScripts !== false && replaceDirectSubSuperScripts(node, options)) {
      return;
    }
    if (options?.replaceNumber !== false && replaceNumberedSubSuperScripts(node, options)) {
      return;
    }
    // if (replaceSubSuperScripts(node, vfile)) return;
    // if (replaceTextCommand(node, vfile)) return;
    if (options?.replaceNumber !== false && replaceNumber(node, options)) {
      return;
    }
  });
}

export const inlineMathSimplificationPlugin: Plugin<[Options?], GenericParent, GenericParent> =
  (opts) => (tree) => {
    inlineMathSimplificationTransform(tree, opts);
  };
