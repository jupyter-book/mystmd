import type { Handler } from './types.js';
import { getArguments, texToText } from './utils.js';

const CHEM_HANDLERS: Record<string, Handler> = {
  macro_ce(node, state) {
    state.openParagraph();
    const value = texToText(getArguments(node, 'group')[0]);
    state.addLeaf('chemicalFormula', {
      value,
    });
    return;
  },
};

export { CHEM_HANDLERS };
