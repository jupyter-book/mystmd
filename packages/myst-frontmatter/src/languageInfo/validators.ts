import type { ValidationOptions } from 'simple-validators';
import { incrementOptions, validateObjectKeys, validateString } from 'simple-validators';
import type { LanguageInfo } from './types.js';

/**
 * Validate LanguageInfo object
 */
export function validateLanguageInfo(
  input: any,
  opts: ValidationOptions,
): LanguageInfo | undefined {
  const value = validateObjectKeys(input, { required: ['name'] }, opts);
  if (value === undefined) return undefined;

  const name = validateString(value.name, incrementOptions('name', opts));
  if (name === undefined) return undefined;

  return { name };
}
