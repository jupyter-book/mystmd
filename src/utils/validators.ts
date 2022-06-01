import { Logger } from '../logging';

export type Options = {
  logger: Logger;
  property: string;
  file?: string;
  location?: string;
  suppressWarnings?: boolean;
  count: { errors?: number; warnings?: number };
};

export function defined(val: any) {
  return val != null;
}

export function locationSuffix(opts: Options) {
  if (opts.file && opts.location) return ` (at ${opts.file}#${opts.location})`;
  if (opts.file || opts.location) return ` (at ${opts.file || opts.location})`;
  return '';
}

export function incrementOptions(property: string, opts: Options) {
  let location = opts.property;
  if (opts.location) location = `${opts.location}.${opts.property}`;
  return { ...opts, property, location };
}

export function validationError(message: string, opts: Options) {
  if (opts.count.errors) {
    opts.count.errors += 1;
  } else {
    opts.count.errors = 1;
  }
  opts.logger.error(`Validation error: "${opts.property}" ${message}${locationSuffix(opts)}`);
  return undefined;
}

export function validationMessage(message: string, opts: Options) {
  if (!opts.suppressWarnings) {
    if (opts.count.warnings) {
      opts.count.warnings += 1;
    } else {
      opts.count.warnings = 1;
    }
    opts.logger.warn(`Validation: "${opts.property}" ${message}${locationSuffix(opts)}`);
  }
}

/**
 * Validate value is boolean
 *
 * String 'true' and 'false' are coerced to booleans; error on any other value, including 1/0, 't'/'f', etc.
 */
export function validateBoolean(input: any, opts: Options) {
  if (typeof input === 'string') {
    if (input.toLowerCase() === 'true') return true;
    if (input.toLowerCase() === 'false') return false;
  }
  if (input === true || input === false) return input;
  return validationError('must be boolean', opts);
}

/**
 * Validates value is a string and obeys max length, if provided.
 */
export function validateString(
  input: any,
  opts: { maxLength?: number; regex?: string } & Options,
): string | undefined {
  if (typeof input !== 'string') return validationError(`must be string`, opts);
  const value = input as string;
  const maxLength = opts.maxLength || 500;
  if (value.length > maxLength) {
    return validationError(`must be less than ${maxLength} chars`, opts);
  }
  if (opts.regex && !value.match(opts.regex)) {
    return validationError(`must match regex ${opts.regex}`, opts);
  }
  return value;
}

/**
 * Validate value is valid URL string of max length 2048
 *
 * If 'include' is provided, value must include it in the origin.
 */
export function validateUrl(input: any, opts: { includes?: string } & Options) {
  let value = validateString(input, { ...opts, maxLength: 2048 });
  if (value === undefined) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    try {
      value = `http://${value}`;
      url = new URL(value);
    } catch {
      return validationError('must be valid URL', opts);
    }
  }
  if (opts.includes && !url.origin.includes(opts.includes)) {
    return validationError(`must include "${opts.includes}"`, opts);
  }
  return value;
}

/**
 * Validate value is valid email
 */
export function validateEmail(input: any, opts: Options) {
  const value = validateString(input, opts);
  if (value === undefined) return value;
  const valid = value
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
  if (!valid) {
    return validationError('must be valid email address', opts);
  }
  return value;
}

/**
 * Validate date string or object
 *
 * Uses javascript Date() constructor; any input to the constructor that returns
 * a valid date is valid input. This includes ISO 8601 formatted strings and
 * IETF timestamps are valid.
 */
export function validateDate(input: any, opts: Options) {
  if (!new Date(input).getDate()) {
    return validationError(
      `invalid date "${input}" - must be ISO 8601 format or IETF timestamp`,
      opts,
    );
  }
  // TODO: Helpful to coerce to a uniform format?
  return input;
}

/**
 * Validates value is an object
 */
export function validateObject(input: any, opts: Options) {
  if (typeof input !== 'object') return validationError(`must be object`, opts);
  return input as Record<string, any>;
}

/**
 * Validate an object has all required keys
 *
 * Returns new object with only required/optional keys
 */
export function validateKeys(
  input: Record<string, any>,
  keys: { required?: string[]; optional?: string[] },
  opts: Options,
) {
  const value: Record<string, any> = {};
  let required = keys.required || [];
  const optional = keys.optional || [];
  const ignored: string[] = [];
  Object.keys(input).forEach((k) => {
    if (required.includes(k) || optional.includes(k)) {
      value[k] = input[k];
      required = required.filter((val) => val !== k);
    } else {
      ignored.push(k);
    }
  });
  if (required.length) {
    return validationError(
      `missing required key${required.length > 1 ? 's' : ''}: ${required.join(', ')}`,
      opts,
    );
  }
  if (ignored.length) {
    validationMessage(
      `extra key${ignored.length > 1 ? 's' : ''} ignored: ${ignored.join(', ')}`,
      opts,
    );
  }
  return value;
}

/**
 * Validates value is an object and has all required keys
 *
 * Returns new object with only required/optional keys
 */
export function validateObjectKeys(
  input: any,
  keys: { required?: string[]; optional?: string[] },
  opts: Options,
) {
  const value = validateObject(input, opts);
  if (value === undefined) return undefined;
  return validateKeys(value, keys, opts);
}

/**
 * Validate value is a list
 */
export function validateList<T>(
  input: any,
  opts: Options,
  itemValidator: (item: any, index: number) => T | undefined,
) {
  if (!Array.isArray(input)) {
    return validationError('must be an array', opts);
  }
  const value = input as any[];
  return value
    .map((item, index) => itemValidator(item, index))
    .filter((item): item is T => item !== undefined);
}

/**
 * Copy 'base' object and fill any 'keys' that are missing with their values from 'filler'
 */
export function fillMissingKeys<T extends Record<string, any>>(
  base: T,
  filler: T,
  keys: (keyof T | string)[],
): T {
  const output: T = { ...base };
  keys.forEach((key) => {
    if (!defined(output[key]) && defined(filler[key])) {
      key = key as keyof T;
      output[key] = filler[key];
    }
  });
  return output;
}
