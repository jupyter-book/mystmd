import type { ValidationOptions } from 'simple-validators';
import { defined, incrementOptions, validateObjectKeys, validateString } from 'simple-validators';
import { validateDoi, validateStringOrNumber } from '../utils/validators.js';
import type { PublicationMeta } from './types.js';

const PUBLICATION_META_KEYS = ['number', 'doi', 'title', 'subject'];

/**
 * Validate Publication Metadata object, used for volumes and issues
 */
export function validatePublicationMeta(input: any, opts: ValidationOptions) {
  if (typeof input !== 'object') {
    input = { number: input };
  }
  const value = validateObjectKeys(
    input,
    { optional: PUBLICATION_META_KEYS, alias: { name: 'number' } },
    opts,
  );
  if (value === undefined) return undefined;
  const output: PublicationMeta = {};
  if (defined(value.number)) {
    output.number = validateStringOrNumber(value.number, incrementOptions('number', opts));
  }
  if (defined(value.doi)) {
    output.doi = validateDoi(value.doi, incrementOptions('doi', opts));
  }
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.subject)) {
    output.subject = validateString(value.subject, incrementOptions('subject', opts));
  }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}
