import type { GenericNode } from 'myst-common';
import type { IndexEntry } from 'myst-spec-ext';
import type { ITexSerializer } from './types.js';
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
  '^': '\\^',
};

const textOnlyReplacements: Record<string, string> = {
  ...hrefOnlyReplacements,
  // quotes
  '’': "'",
  '‘': '`',
  '”': "''",
  '“': '``',
  // guillemots
  '»': '>>', // These could be improved
  '«': '<<',
  '…': '\\dots',
  '–': '--',
  '—': '---',
  // Commands gobble fhttps://texfaq.org/FAQ-xspaceollowing space
  // See: https://texfaq.org/FAQ-xspace
  '©': '\\textcopyright ',
  '®': '\\textregistered ',
  '™': '\\texttrademark ',
  '<': '\\textless ',
  '>': '\\textgreater ',
  ' ': '~',
  ' ': '~',
  ' ': '\\,',
};

const arrows: Record<string, string> = {
  '↔': '\\leftrightarrow',
  '⇔': '\\Leftrightarrow',
  '→': '\\rightarrow',
  '⇒': '\\Rightarrow',
  '←': '\\leftarrow',
  '⇐': '\\Leftarrow',
};

const symbols: Record<string, string> = {
  '−': '-', // minus
  '-': '-', // hyphen minus
  '﹣': '-', // Small hyphen minus
  '－': '-', // Full-width Hyphen-minus
  '＋': '+', // Full-width Plus
};

const scripts: Record<string, string> = {
  '₀': '\\textsubscript{0}',
  '₁': '\\textsubscript{1}',
  '₂': '\\textsubscript{2}',
  '₃': '\\textsubscript{3}',
  '₄': '\\textsubscript{4}',
  '₅': '\\textsubscript{5}',
  '₆': '\\textsubscript{6}',
  '₇': '\\textsubscript{7}',
  '₈': '\\textsubscript{8}',
  '₉': '\\textsubscript{9}',
  '₊': '\\textsubscript{+}',
  '₋': '\\textsubscript{-}',
  '₌': '\\textsubscript{=}',
  '₍': '\\textsubscript{(}',
  '₎': '\\textsubscript{)}',
  ₙ: '\\textsubscript{n}',
  '⁰': '\\textsuperscript{0}',
  '¹': '\\textsuperscript{1}',
  '²': '\\textsuperscript{2}',
  '³': '\\textsuperscript{3}',
  '⁴': '\\textsuperscript{4}',
  '⁵': '\\textsuperscript{5}',
  '⁶': '\\textsuperscript{6}',
  '⁷': '\\textsuperscript{7}',
  '⁸': '\\textsuperscript{8}',
  '⁹': '\\textsuperscript{9}',
  '⋅': '\\textsuperscript{.}',
  '⁺': '\\textsuperscript{.}',
  '⁻': '\\textsuperscript{-}',
  '⁼': '\\textsuperscript{=}',
  '⁽': '\\textsuperscript{(}',
  '⁾': '\\textsuperscript{)}',
  ⁿ: '\\textsuperscript{n}',
  ⁱ: '\\textsuperscript{i}',
};

const textReplacements: Record<string, string> = {
  ...textOnlyReplacements,
  ...arrows,
  ...symbols,
  ...scripts,
};

const mathReplacements: Record<string, string> = {
  ...arrows,
  ...symbols,
  '½': '\\frac{1}{2}',
  '⅓': '\\frac{1}{3}',
  '⅔': '\\frac{2}{3}',
  '¼': '\\frac{1}{4}',
  '⅕': '\\frac{1}{5}',
  '⅖': '\\frac{2}{5}',
  '⅗': '\\frac{3}{5}',
  '⅘': '\\frac{4}{5}',
  '⅙': '\\frac{1}{6}',
  '⅚': '\\frac{5}{6}',
  '⅐': '\\frac{1}{7}',
  '⅛': '\\frac{1}{8}',
  '⅜': '\\frac{3}{8}',
  '⅝': '\\frac{5}{8}',
  '⅞': '\\frac{7}{8}',
  '⅑': '\\frac{1}{9}',
  '⅒': '\\frac{1}{10}',
  '±': '\\pm',
  '×': '\\times',
  '⋆': '\\star',
  Α: 'A',
  α: '\\alpha',
  Β: 'B',
  β: '\\beta',
  ß: '\\beta',
  Γ: '\\Gamma',
  γ: '\\gamma',
  Δ: '\\Delta',
  '∆': '\\Delta',
  δ: '\\delta',
  Ε: 'E',
  ε: '\\epsilon',
  Ζ: 'Z',
  ζ: '\\zeta',
  Η: 'H',
  η: '\\eta',
  Θ: '\\Theta',
  θ: '\\theta',
  ϑ: '\\vartheta',
  Ι: 'I',
  ι: '\\iota',
  Κ: 'K',
  κ: '\\kappa',
  Λ: '\\Lambda',
  λ: '\\lambda',
  Μ: 'M',
  μ: '\\mu',
  Ν: 'N',
  ν: '\\nu',
  Ξ: '\\Xi',
  ξ: '\\xi',
  Ο: 'O',
  ο: 'o',
  Π: '\\Pi',
  π: '\\pi',
  Ρ: 'P',
  ρ: '\\rho',
  Σ: '\\Sigma',
  σ: '\\sigma',
  Τ: 'T',
  τ: '\\tau',
  Υ: '\\Upsilon',
  υ: '\\upsilon',
  Φ: '\\Phi',
  ϕ: '\\phi',
  φ: '\\varphi',
  Χ: 'X',
  χ: '\\chi',
  Ψ: '\\Psi',
  ψ: '\\psi',
  Ω: '\\Omega',
  ω: '\\omega',
  '∂': '\\partial',
  '∞': '\\infty',
  '∝': '\\propto',
  '⧜': '\\iinfin',
  '⧝': '\\tieinfty',
  '♾': '\\acidfree',
  '≈': '\\approx',
  '≠': '\\neq',
  '≥': '\\geq',
  '≤': '\\leq',
  '•': '\\cdot',
  // '‰': '\\permille',
};

type SimpleTokens = { kind: 'math' | 'text'; text: string };

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
  return `${lineWidth / 100}\\linewidth`;
}

export function getClasses(className?: string): string[] {
  const classes =
    className
      ?.split(' ')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => !!s) ?? [];
  return Array.from(new Set(classes));
}

export function addIndexEntries(node: GenericNode, state: ITexSerializer) {
  if (!node.indexEntries?.length) return;
  state.data.hasIndex = true;
  (node.indexEntries as IndexEntry[]).forEach(({ entry, subEntry, emphasis }) => {
    let indexString = entry;
    if (subEntry?.value) {
      if (subEntry?.kind === 'see') {
        indexString += `|see{${subEntry.value}}`;
      } else if (subEntry?.kind === 'seealso') {
        indexString += `|seealso{${subEntry.value}}`;
      } else {
        indexString += `!${subEntry.value}`;
      }
    }
    if (emphasis) {
      indexString += '|textbf';
    }
    state.write(`\\index{${indexString}}`);
  });
}
