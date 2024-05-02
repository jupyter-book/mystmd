import {
  defined,
  incrementOptions,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationError,
  validationWarning,
  type ValidationOptions,
} from 'simple-validators';
import {
  KNOWN_REFERENCE_KINDS,
  RESERVED_REFERENCE_KEYS,
  type ExternalReference,
  type ExternalReferences,
} from './types.js';

function validateExternalReference(
  input: any,
  opts: ValidationOptions,
): ExternalReference | undefined {
  if (typeof input === 'string') {
    input = { url: input };
  }
  const value = validateObjectKeys(input, { required: ['url'], optional: ['kind'] }, opts);
  if (!value) return undefined;
  let url = validateUrl(value.url, incrementOptions('url', opts));
  if (!url) return undefined;
  if (url.endsWith('/')) {
    url = url.slice(0, url.length - 1);
  }
  const output: ExternalReference = { url };
  if (defined(value.kind)) {
    const kindOpts = incrementOptions(value.kind, opts);
    let kind = validateString(value.kind, kindOpts)?.toLowerCase();
    if (kind === 'sphinx' || kind === 'inv') kind = 'intersphinx';
    if (kind && !KNOWN_REFERENCE_KINDS.includes(kind)) {
      validationWarning(`Unknown external reference kind "${kind}"`, kindOpts);
    }
    if (kind) output.kind = kind;
  }
  return output;
}

export function validateExternalReferences(
  input: any,
  opts: ValidationOptions,
): ExternalReferences | undefined {
  const value = validateObject(input, opts);
  if (!value) return undefined;
  const output = Object.fromEntries(
    Object.entries(value)
      .map(([key, ref]) => {
        if (RESERVED_REFERENCE_KEYS.includes(key)) {
          return validationError(`Cannot use reserved reference key "${key}"`, opts);
        }
        const outputRef = validateExternalReference(ref, incrementOptions(key, opts));
        if (!outputRef) return undefined;
        return [key, outputRef];
      })
      .filter((exists): exists is [string, ExternalReference] => !!exists),
  );
  return Object.keys(output).length ? output : undefined;
}
