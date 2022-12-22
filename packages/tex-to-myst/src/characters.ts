import type { Handler, ITexParser } from './types';
import { getArguments, texToText } from './utils';
import type { GenericNode } from 'myst-common';

function createText(state: ITexParser, node: GenericNode, translate: Record<string, string>) {
  state.openParagraph();
  const value = texToText(getArguments(node, 'group'));
  const converted = translate[value];
  if (converted) {
    state.text(converted, false);
    return;
  }
  state.warn(`Unknown character ${value}`, node, 'tex-to-myst:characters');
  state.text(converted, false);
}

function addText(state: ITexParser, value?: string) {
  if (!value) return;
  state.openParagraph();
  state.text(value, false);
}

// There is probably a better way to explicitly add accents to letters in node.
// https://en.wikibooks.org/wiki/LaTeX/Special_Characters#Escaped_codes
const accents = {
  '`': { o: 'ò', O: 'Ò' },
  "'": { o: 'ó', O: 'Ó' },
  '^': { '': '^', o: 'ô', i: 'î', y: 'ŷ', O: 'Ô', I: 'Î', Y: 'Ŷ' },
  '"': { o: 'ö', u: 'ü', i: 'ï', O: 'Ö', U: 'Ü', I: 'Ï' },
  H: { o: 'ő', O: 'Ő' },
  '~': { '': '~', o: 'õ', n: 'ñ', O: 'Õ', N: 'Ñ', u: 'ũ', U: 'Ũ', e: 'ẽ', E: 'Ẽ', i: 'ĩ', I: 'Ĩ' },
  c: { c: 'ç', C: 'Ç' },
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
const symbols = {
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
};

const CHARACTER_HANDLERS: Record<string, Handler> = {
  ...Object.fromEntries(
    Object.entries(accents).map(([macro, translate]): [string, Handler] => {
      return [
        `macro_${macro}`,
        (node, state) => {
          createText(state, node, translate);
        },
      ];
    }),
  ),
  ...Object.fromEntries(
    Object.entries(symbols).map(([macro, text]): [string, Handler] => {
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
