import type { GenericNode } from 'myst-common';
import { DEFAULT_IMAGE_WIDTH, DEFAULT_PAGE_WIDTH_PIXELS } from './types.js';

/** Removes nobreak and zero-width spaces */
export function cleanWhitespaceChars(text: string, nbsp = ' '): string {
  return text.replace(/\u00A0/g, nbsp).replace(/[\u200B-\u200D\uFEFF]/g, '');
}

// Funky placeholders (unlikely to be written ...?!)
const BACKSLASH_SPACE = '💥🎯BACKSLASHSPACE🎯💥';
const BACKSLASH = '💥🎯BACKSLASH🎯💥';
const TILDE = '💥🎯TILDE🎯💥';

const hrefOnlyReplacements: Record<string, string> = {
  // Not allowed characters
  // Latex escaped characters are: \ & % $ # _ { } ~ ^
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '[': '\\[',
  ']': '\\]',
  '^': '\\^',
};

const textOnlyReplacements: Record<string, string> = {
  ...hrefOnlyReplacements,
  // quotes
  '’': "'",
  '‘': "'",
  '”': '"',
  '“': '"',
  // guillemots
  // '»': '>>', // These could be improved
  // '«': '<<',
  // '…': '\\dots',
  // '–': '--',
  // '—': '---',
  // Commands gobble fhttps://texfaq.org/FAQ-xspaceollowing space
  // See: https://texfaq.org/FAQ-xspace
  '©': '#emoji.copyright ',
  '®': '#emoji.reg ',
  '™': '#emoji.tm ',
  '<': '\\< ',
  '>': '\\> ',
  ' ': '~',
  ' ': '~',
  // eslint-disable-next-line no-irregular-whitespace
  // ' ': '\\,',
};

const arrows: Record<string, string> = {
  '↔': 'arrow.l.r',
  '⇔': 'arrow.l.r.double',
  '→': 'arrow.r',
  '⇒': 'arrow.r.double',
  '←': 'arrow.l',
  '⇐': 'arrow.l.double',
};

const symbols: Record<string, string> = {
  '−': '-', // minus
  '-': '-', // hyphen minus
  '﹣': '-', // Small hyphen minus
  '－': '-', // Full-width Hyphen-minus
  '＋': '+', // Full-width Plus
};

const textReplacements: Record<string, string> = {
  ...textOnlyReplacements,
  ...arrows,
  ...symbols,
};

const mathReplacements: Record<string, string> = {
  ...arrows,
  ...symbols,
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅐': '1/7',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
  '⅑': '1/9',
  '⅒': '1/10',
  '±': 'plus.minus',
  '×': 'times',
  Α: 'A',
  α: 'alpha',
  Β: 'B',
  β: 'beta',
  ß: 'beta',
  Γ: 'Gamma',
  γ: 'gamma',
  Δ: 'Delta',
  '∆': 'Delta',
  δ: 'delta',
  Ε: 'E',
  ε: 'epsilon',
  Ζ: 'Z',
  ζ: 'zeta',
  Η: 'H',
  η: 'eta',
  Θ: 'Theta',
  θ: 'theta',
  ϑ: 'vartheta',
  Ι: 'I',
  ι: 'iota',
  Κ: 'K',
  κ: 'kappa',
  Λ: 'Lambda',
  λ: 'lambda',
  Μ: 'M',
  μ: 'mu',
  Ν: 'N',
  ν: 'nu',
  Ξ: 'Xi',
  ξ: 'xi',
  Ο: 'O',
  ο: 'o',
  Π: 'Pi',
  π: 'pi',
  Ρ: 'P',
  ρ: 'rho',
  Σ: 'Sigma',
  σ: 'sigma',
  Τ: 'T',
  τ: 'tau',
  Υ: 'Upsilon',
  υ: 'upsilon',
  Φ: 'Phi',
  ϕ: 'phi',
  φ: 'phi.alt',
  Χ: 'X',
  χ: 'chi',
  Ψ: 'Psi',
  ψ: 'psi',
  Ω: 'Omega',
  ω: 'omega',
  '∂': 'diff',
  '∞': 'infty',
  '≈': 'approx',
  '≠': 'eq.not',
  '•': 'dot.c',
  // '‰': '\\permille',
};

type SimpleTokens = { kind: 'math' | 'text'; text: string };

export function nodeOnlyHasTextChildren(node?: GenericNode) {
  if (!node || !node.children || node.children.length === 0) return false;
  return node.children.reduce((previous, { type }) => previous && type === 'text', true);
}

export function hrefToLatexText(text: string) {
  const replacedArray: SimpleTokens[] = Array.from(text ?? '').map((char) => {
    if (hrefOnlyReplacements[char]) return { kind: 'text', text: hrefOnlyReplacements[char] };
    return { kind: 'text', text: char };
  });

  const replaced = replacedArray
    .reduce((arr, next) => {
      const prev = arr.slice(-1)[0];
      if (prev?.kind === next.kind) prev.text += next.text;
      else arr.push(next);
      return arr;
    }, [] as SimpleTokens[])
    .reduce((s, next) => {
      return s + next.text;
    }, '');

  return replaced;
}

export function stringToLatexText(text: string) {
  const escaped = (text ?? '')
    .replace(/\\ /g, BACKSLASH_SPACE)
    .replace(/\\/g, BACKSLASH)
    .replace(/~/g, TILDE);

  const replacedArray: SimpleTokens[] = Array.from(escaped).map((char) => {
    if (textReplacements[char]) return { kind: 'text', text: textReplacements[char] };
    if (mathReplacements[char]) return { kind: 'math', text: mathReplacements[char] };
    return { kind: 'text', text: char };
  });

  const replaced = replacedArray
    .reduce((arr, next) => {
      // Join any strings of math or text together (avoids $\delta$$\mu$ --> $\delta\mu$)
      const prev = arr.slice(-1)[0];
      if (prev?.kind === next.kind) prev.text += next.text;
      else arr.push(next);
      return arr;
    }, [] as SimpleTokens[])
    .reduce((s, next) => {
      if (next.kind === 'math') return `${s}$${next.text}$`;
      return s + next.text;
    }, '');

  const final = replaced
    .replace(new RegExp(BACKSLASH_SPACE, 'g'), '{\\textbackslash}~')
    .replace(new RegExp(BACKSLASH, 'g'), '{\\textbackslash}')
    .replace(new RegExp(TILDE, 'g'), '{\\textasciitilde}');
  return cleanWhitespaceChars(final, '~');
}

export function stringToLatexMath(text: string) {
  const replaced = Array.from(text ?? '').reduce((s, char) => {
    if (mathReplacements[char]) {
      const space = s.slice(-1) === ' ' ? '' : ' ';
      return `${s}${space}${mathReplacements[char]}`;
    }
    return s + char;
  }, '');
  const final = replaced.trim();
  return cleanWhitespaceChars(final);
}

export function getLatexImageWidth(width?: number | string): string {
  if (typeof width === 'number' && Number.isNaN(width)) {
    // If it is nan, return with the default.
    return getLatexImageWidth(DEFAULT_IMAGE_WIDTH);
  }
  if (typeof width === 'string') {
    if (width.endsWith('%')) {
      return getLatexImageWidth(Number(width.replace('%', '')));
    } else if (width.endsWith('px')) {
      return getLatexImageWidth(Number(width.replace('px', '')) / DEFAULT_PAGE_WIDTH_PIXELS);
    }
    console.log(`Unknown width ${width} in getLatexImageWidth`);
    return getLatexImageWidth(DEFAULT_IMAGE_WIDTH);
  }
  let lineWidth = width ?? DEFAULT_IMAGE_WIDTH;
  if (lineWidth < 1) lineWidth *= 100;
  return `${lineWidth}%`;
}

export function getClasses(className?: string): string[] {
  const classes =
    className
      ?.split(' ')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => !!s) ?? [];
  return Array.from(new Set(classes));
}
