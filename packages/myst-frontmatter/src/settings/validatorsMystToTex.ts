import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateChoice,
  validateObjectKeys,
} from 'simple-validators';
import type { MystToTexSettings } from './types.js';

export const MYST_TO_TEX_SETTINGS = ['codeStyle', 'beamer'];
export const MYST_TO_TEX_SETTINGS_ALIAS = {
  code_style: 'codeStyle',
};

export function validateMystToTexSettings(
  value: Record<string, any>,
  opts: ValidationOptions,
): MystToTexSettings | undefined {
  const output: MystToTexSettings = {};
  const settings = validateObjectKeys(
    value,
    { optional: MYST_TO_TEX_SETTINGS, alias: MYST_TO_TEX_SETTINGS_ALIAS },
    opts,
  );
  if (!settings) return undefined;
  if (defined(settings.codeStyle)) {
    const codeStyle = validateChoice<MystToTexSettings['codeStyle']>(settings.codeStyle, {
      ...incrementOptions('codeStyle', opts),
      choices: ['verbatim', 'minted', 'listings'],
    });
    if (codeStyle) output.codeStyle = codeStyle;
  }
  if (defined(settings.beamer)) {
    output.beamer = validateBoolean(settings.beamer, incrementOptions('beamer', opts));
  }
  // if (defined(settings.printGlossaries)) {
  //   const printGlossaries = validateBoolean(
  //     settings.printGlossaries,
  //     incrementOptions('printGlossaries', opts),
  //   );
  //   if (typeof printGlossaries === 'boolean') output.printGlossaries = printGlossaries;
  // }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}
