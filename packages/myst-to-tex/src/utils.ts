import { DEFAULT_IMAGE_WIDTH, DEFAULT_PAGE_WIDTH_PIXELS } from './types';

/** Removes nobreak and zero-width spaces */
export function cleanWhitespaceChars(text: string, nbsp = ' '): string {
  return text.replace(/\u00A0/g, nbsp).replace(/[\u200B-\u200D\uFEFF]/g, '');
}

// Funky placeholders (unlikely to be written ...?!)
const BACKSLASH_SPACE = '💥🎯BACKSLASHSPACE🎯💥';
const BACKSLASH = '💥🎯BACKSLASH🎯💥';
const TILDE = '💥🎯TILDE🎯💥';

const textOnlyReplacements: Record<string, string> = {
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
  '©': '\\textcopyright',
  '®': '\\textregistered',
  '™': '\\texttrademark',
  '<': '\\textless',
  '>': '\\textgreater',
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

const textReplacements: Record<string, string> = {
  ...textOnlyReplacements,
  ...arrows,
  ...symbols,
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
  '≈': '\\approx',
  '≠': '\\neq',
  '•': '\\cdot',
  // '‰': '\\permille',
};

type SimpleTokens = { kind: 'math' | 'text'; text: string };

export function stringToLatexText(text: string) {
  const escaped = (text ?? '')
    .replace(/\\ /g, BACKSLASH_SPACE)
    .replace(/\\/g, BACKSLASH)
    .replace(/~/g, TILDE);

  const replacedArray: SimpleTokens[] = Array(...escaped).map((char) => {
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
  const replaced = Array(...(text ?? '')).reduce((s, char) => {
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
