import type { ValidationOptions } from 'simple-validators';
import { defined, incrementOptions, validateBoolean, validateObjectKeys } from 'simple-validators';
import type { ParserSettings } from './types.js';

export const PARSER_SETTINGS = ['dollarmath', 'strikethrough'];
export const PARSER_SETTINGS_ALIAS = {
  dollar_math: 'dollarmath',
};

export function validateParserSettings(
  value: Record<string, any>,
  opts: ValidationOptions,
): ParserSettings | undefined {
  const output: ParserSettings = {};
  const settings = validateObjectKeys(
    value,
    { optional: PARSER_SETTINGS, alias: PARSER_SETTINGS_ALIAS },
    opts,
  );
  if (!settings) return undefined;
  if (defined(settings.dollarmath)) {
    const dollarmath = validateBoolean(settings.dollarmath, incrementOptions('dollarmath', opts));
    if (dollarmath != null) output.dollarmath = dollarmath;
  }
  if (defined(settings.strikethrough)) {
    const strikethrough = validateBoolean(
      settings.strikethrough,
      incrementOptions('strikethrough', opts),
    );
    if (strikethrough != null) output.strikethrough = strikethrough;
  }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}
