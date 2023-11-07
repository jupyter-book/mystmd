import { doi } from 'doi-utils';
import type { ValidationOptions } from 'simple-validators';
import {
  incrementOptions,
  validateBoolean,
  validateString,
  validateUrl,
  validationError,
} from 'simple-validators';

export const GITHUB_USERNAME_REPO_REGEX = '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$';

export function validateBooleanOrObject<T extends Record<string, any>>(
  input: any,
  opts: ValidationOptions,
  objectValidator: (input: any, opts: ValidationOptions) => T | undefined,
): boolean | T | undefined {
  let output: boolean | T | undefined = validateBoolean(input, {
    ...opts,
    suppressWarnings: true,
    suppressErrors: true,
  });
  // TODO: could add an error here for validation of a non-bool non-object
  if (output === undefined) {
    output = objectValidator(input, opts);
  }
  return output;
}

export function validateDoi(value: any, opts: ValidationOptions) {
  const doiString = validateString(value, opts);
  if (doiString !== undefined) {
    if (doi.validate(doiString, { strict: true })) {
      return doiString;
    } else {
      validationError('must be valid DOI', opts);
    }
  }
  return undefined;
}

export function validateGithubUrl(value: any, opts: ValidationOptions) {
  let github = value;
  if (typeof github === 'string') {
    const repo = github.match(GITHUB_USERNAME_REPO_REGEX);
    if (repo) {
      github = `https://github.com/${repo}`;
    }
  }
  return validateUrl(github, {
    ...incrementOptions('github', opts),
    includes: 'github',
  });
}

export function validateStringOrNumber(input: any, opts: ValidationOptions) {
  if (typeof input === 'string') return validateString(input, opts);
  if (typeof input === 'number') return input;
  return validationError('must be string or number', opts);
}
