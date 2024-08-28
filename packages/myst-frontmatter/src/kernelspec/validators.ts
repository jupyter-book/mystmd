import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
  validationWarning,
} from 'simple-validators';
import type { KernelSpec } from './types.js';

const KERNELSPEC_KEYS = ['name', 'display_name', 'language', 'argv', 'env'];

/**
 * Validate KernelSpec object
 */
export function validateKernelSpec(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: KERNELSPEC_KEYS }, opts);
  if (value === undefined) return undefined;

  // name is a required member of KernelSpec, but hasn't previously been required
  let name: string;
  if (defined(value.name)) {
    const validatedName = validateString(value.name, incrementOptions('name', opts));
    if (validatedName === undefined) return undefined;
    name = validatedName;
  } else {
    name = 'python3';
    validationWarning(`"name" key is required; using '${name}' as placeholder value`, opts);
  }

  // The same logic for `display_name` applies. It is usually ignored by frontends
  // in favour of the actual kernel information, so we assign an arbitrary value for now.
  // Note that jupytext complains if its missing, so we should push people to set it
  let displayName: string;
  if (defined(value.display_name)) {
    const validatedDisplayName = validateString(
      value.display_name,
      incrementOptions('display_name', opts),
    );
    if (validatedDisplayName === undefined) return undefined;
    displayName = validatedDisplayName;
  } else {
    displayName = `${name} Kernel`;
    validationWarning(
      `"display_name" key is required; using '${displayName}' as placeholder value`,
      opts,
    );
  }

  const output: KernelSpec = { name, display_name: displayName };
  if (defined(value.language)) {
    output.language = validateString(value.language, incrementOptions('language', opts));
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
