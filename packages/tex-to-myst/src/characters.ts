import type { Handler, ITexParser } from './types.js';
import { LatexAccents, LatexSpecialSymbols, getArguments, texToText } from './utils.js';
import type { GenericNode } from 'myst-common';

function createText(
  state: ITexParser,
  node: GenericNode,
  translate: Record<string, string>,
  macro: string,
) {
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
    state.warn(
      `Unknown character for accent "\\${macro}{${value}}"`,
      node,
      'tex-to-myst:characters',
    );
    state.text(converted, false);
  });
}

function addText(state: ITexParser, value?: string) {
  if (!value) return;
  state.openParagraph();
  state.text(value, false);
}

const CHARACTER_HANDLERS: Record<string, Handler> = {
  ...Object.fromEntries(
    Object.entries(LatexAccents).map(([macro, translate]): [string, Handler] => {
      return [
        `macro_${macro}`,
        (node, state) => {
          createText(state, node, translate, macro);
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
