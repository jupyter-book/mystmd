import type { Handler, ITexParser } from './types';
import { getArguments, texToText } from './utils';
import type { GenericNode } from 'myst-common';

/** https://en.wikipedia.org/wiki/Thin_space */
export const THIN_SPACE = ' ';

/** https://en.wikipedia.org/wiki/Non-breaking_space#Width_variation */
export const NARROW_NO_BREAK_SPACE = ' ';

function createText(state: ITexParser, node: GenericNode, translate: Record<string, string>) {
  state.openParagraph();
  const values = texToText(getArguments(node, 'group'));
  // If the exact value is included
  const exact = translate[values];
  if (exact) {
    state.text(exact, false);
    return;
  }
  values.split('').forEach((value) => {
    const converted = translate[value];
    if (converted) {
      state.text(converted, false);
      return;
    }
    state.warn(`Unknown character "${value}"`, node, 'tex-to-myst:characters');
    state.text(converted, false);
  });
}

function addText(state: ITexParser, value?: string) {
  if (!value) return;
  state.openParagraph();
  state.text(value, false);
}

// There is probably a better way to explicitly add accents to letters in node.
// https://en.wikibooks.org/wiki/LaTeX/Special_Characters#Escaped_codes
export const LatexAccents = {
  '`': { o: 'ò', O: 'Ò' },
  "'": { o: 'ó', O: 'Ó' },
  '^': { '': '^', o: 'ô', i: 'î', y: 'ŷ', O: 'Ô', I: 'Î', Y: 'Ŷ' },
  '"': { o: 'ö', u: 'ü', i: 'ï', O: 'Ö', U: 'Ü', I: 'Ï' },
  H: { o: 'ő', O: 'Ő' },
  '~': { '': '~', o: 'õ', n: 'ñ', O: 'Õ', N: 'Ñ', u: 'ũ', U: 'Ũ', e: 'ẽ', E: 'Ẽ', i: 'ĩ', I: 'Ĩ' },
  c: { c: 'ç', C: 'Ç', s: 'ş', S: 'Ş' },
  k: { a: 'ą', A: 'Ą' },
  l: { '': 'ł' },
  '=': { o: 'ō', O: 'Ō' },
  '.': { o: 'ȯ', O: 'Ȯ' },
  d: { u: 'ụ', U: 'Ụ' },
  r: { a: 'å', A: 'Å' },
  u: { o: 'ŏ', O: 'Ŏ' },
  v: { s: 'š', S: 'Š' },
  t: { oo: 'o͡o', OO: 'O͡O' },
  o: { '': 'ø' },
  i: { '': 'ı' },
};

// https://en.wikibooks.org/wiki/LaTeX/Special_Characters#Other_symbols
export const LatexSpecialSymbols = {
  '%': '%',
  $: '$',
  '&': '&',
  '{': '{',
  '}': '}',
  _: '_',
  P: '¶',
  dag: '†',
  ddag: '‡',
  textbar: '|',
  textgreater: '>',
  textless: '<',
  textendash: '–',
  textemdash: '—',
  texttrademark: '™',
  textregistered: '®',
  copyright: '©',
  textexclamdown: '¡',
  textquestiondown: '¿',
  pounds: '£',
  // \usepackage[official]{eurosym}
  euro: '€',
  '#': '#',
  S: '§',
  textbackslash: '\\',
  textcelsius: '℃',
  degreeCelsius: '℃',
  celsius: '℃',
  aa: 'å',
  AA: 'Å',
  dots: '…',
  ldots: '…',
  textellipsis: '…',
  textdegree: 'º',
  textasciitilde: '~',
  textvisiblespace: ' ', // Not sure this will work, but close enough
  ' ': ' ', // this is a single backslash followed by a space
  ',': THIN_SPACE, // this is a thin space (https://en.wikipedia.org/wiki/Thin_space) `\,` in latex
};

const CHARACTER_HANDLERS: Record<string, Handler> = {
  ...Object.fromEntries(
    Object.entries(LatexAccents).map(([macro, translate]): [string, Handler] => {
      return [
        `macro_${macro}`,
        (node, state) => {
          createText(state, node, translate);
        },
      ];
    }),
  ),
  ...Object.fromEntries(
    Object.entries(LatexSpecialSymbols).map(([macro, text]): [string, Handler] => {
      return [
        `macro_${macro}`,
        (node, state) => {
          addText(state, text);
        },
      ];
    }),
  ),
};

export { CHARACTER_HANDLERS };
