import {
  defined,
  incrementOptions,
  validateObject,
  validateObjectKeys,
  validateString,
  type ValidationOptions,
} from 'simple-validators';
import type { MathMacro } from './types.js';

export function validateMathMacro(input: any, opts: ValidationOptions) {
  if (typeof input === 'string') {
    input = { macro: input };
  }
  const value = validateObjectKeys(
    input,
    { required: ['macro'], optional: ['title', 'description'] },
    opts,
  );
  if (!value) return;
  const macro = validateString(value.macro, incrementOptions('macro', opts));
  if (!macro) return;
  const output: MathMacro = { macro };
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  return output;
}

export function validateMathMacroObject(input: any, opts: ValidationOptions) {
  const value = validateObject(input, opts);
  if (!value) return;
  const validMacros = Object.entries(value)
    .map(([key, val]) => {
      const macro = validateMathMacro(val, incrementOptions(key, opts));
      if (!macro) return false;
      return [key, macro];
    })
    .filter((valid): valid is [string, MathMacro] => !!valid);
  return Object.fromEntries(validMacros);
}
