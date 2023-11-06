import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateObjectKeys,
  validateString,
} from 'simple-validators';
import type { Numbering } from './types.js';

export const NUMBERING_KEYS = [
  'enumerator',
  'figure',
  'equation',
  'table',
  'code',
  'heading_1',
  'heading_2',
  'heading_3',
  'heading_4',
  'heading_5',
  'heading_6',
];

/**
 * Validate Numbering object
 */
export function validateNumbering(input: any, opts: ValidationOptions): Numbering | undefined {
  const value = validateObjectKeys(input, { optional: NUMBERING_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: Record<string, any> = {};
  if (defined(value.enumerator)) {
    output.enumerator = validateString(value.enumerator, incrementOptions('enumerator', opts));
  }
  NUMBERING_KEYS.filter((key) => key !== 'enumerator').forEach((key) => {
    if (defined(value[key])) {
      output[key] = validateBoolean(value[key], incrementOptions(key, opts));
    }
  });
  return output;
}
