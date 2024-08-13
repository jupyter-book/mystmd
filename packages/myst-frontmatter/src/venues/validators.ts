import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateObjectKeys,
  validateString,
  validateUrl,
} from 'simple-validators';
import { validateDoi } from '../utils/validators.js';
import type { Venue } from './types.js';

/**
 * Validate Venue object against the schema
 *
 * If 'value' is a string, venue will be coerced to object { title: value }
 */
export function validateVenue(input: any, opts: ValidationOptions) {
  let titleOpts: ValidationOptions;
  if (typeof input === 'string') {
    input = { title: input };
    titleOpts = opts;
  } else {
    // This means 'venue.title' only shows up in errors if present in original input
    titleOpts = incrementOptions('title', opts);
  }
  const value = validateObjectKeys(
    input,
    { optional: ['title', 'short_title', 'url', 'doi'] },
    opts,
  );
  if (value === undefined) return undefined;
  const output: Venue = {};
  if (defined(value.title)) {
    output.title = validateString(value.title, titleOpts);
  }
  if (defined(value.short_title)) {
    output.short_title = validateString(value.short_title, incrementOptions('short_title', opts));
  }
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.doi)) {
    output.doi = validateDoi(value.doi, incrementOptions('doi', opts));
  }
  return output;
}
