import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateObjectKeys,
  validateString,
  validateBoolean,
  validateList,
} from 'simple-validators';
import type { Execute } from './types.js';

const EXECUTE_KEYS = ['skip', 'env', 'cache'];

/**
 * Validate Execute object
 */
export function validateExecute(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: EXECUTE_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: Execute = {};
  if (defined(value.skip)) {
    output.skip = validateBoolean(value.skip, incrementOptions('skip', opts));
  }
  if (defined(value.env)) {
    output.env = validateList(value.env, incrementOptions('env', opts), (item, index) =>
      validateString(item, incrementOptions(`env.${index}`, opts)),
    );
  }
  if (defined(value.cache)) {
    output.cache = validateBoolean(value.cache, incrementOptions('cache', opts));
  }
  return output;
}
