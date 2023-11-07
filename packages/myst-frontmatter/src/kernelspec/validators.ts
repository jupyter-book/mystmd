import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
} from 'simple-validators';
import type { KernelSpec } from './types.js';

const KERNELSPEC_KEYS = ['name', 'language', 'display_name', 'argv', 'env'];

/**
 * Validate KernelSpec object
 */
export function validateKernelSpec(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: KERNELSPEC_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: KernelSpec = {};
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.language)) {
    output.language = validateString(value.language, incrementOptions('language', opts));
  }
  if (defined(value.display_name)) {
    output.display_name = validateString(
      value.display_name,
      incrementOptions('display_name', opts),
    );
  }
  if (defined(value.env)) {
    output.env = validateObject(value.env, incrementOptions('env', opts));
  }
  if (defined(value.argv)) {
    output.argv = validateList(value.argv, incrementOptions('argv', opts), (arg, index) => {
      return validateString(arg, incrementOptions(`argv.${index}`, opts));
    });
  }
  return output;
}
