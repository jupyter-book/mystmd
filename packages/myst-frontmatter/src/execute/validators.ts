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

const EXECUTE_KEYS = ['skip', 'depends_on_env', 'cache'];

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
  if (defined(value.depends_on_env)) {
    output.depends_on_env = validateList(
      value.depends_on_env,
      incrementOptions('depends_on_env', opts),
      (item, index) => validateString(item, incrementOptions(`depends_on_env.${index}`, opts)),
    );
  }
  if (defined(value.cache)) {
    output.cache = validateBoolean(value.cache, incrementOptions('cache', opts));
  }
  return output;
}
