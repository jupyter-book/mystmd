import type { ValidationOptions } from 'simple-validators';
import { defined, incrementOptions, validateObjectKeys, validateString } from 'simple-validators';
import { validateDoi, validateStringOrNumber } from '../utils/validators.js';
import type { PublicationMeta } from './types.js';

const PUBLICATION_META_KEYS = ['number', 'doi', 'first_page', 'last_page', 'title', 'subject'];

/**
 * Validate Publication Metadata object, used for volumes and issues
 */
export function validatePublicationMeta(input: any, opts: ValidationOptions) {
  if (typeof input !== 'object') {
    input = { number: input };
  }
  const value = validateObjectKeys(input, { optional: PUBLICATION_META_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: PublicationMeta = {};
  if (defined(value.number)) {
    output.number = validateStringOrNumber(value.number, incrementOptions('number', opts));
  }
  if (defined(value.doi)) {
    output.doi = validateDoi(value.doi, incrementOptions('doi', opts));
  }
  if (defined(value.first_page)) {
    output.first_page = validateStringOrNumber(
      value.first_page,
      incrementOptions('first_page', opts),
    );
  }
  if (defined(value.last_page)) {
    output.last_page = validateStringOrNumber(value.last_page, incrementOptions('last_page', opts));
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
