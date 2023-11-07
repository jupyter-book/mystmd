import type { ValidationOptions } from 'simple-validators';
import { defined, incrementOptions, validateObjectKeys } from 'simple-validators';
import { validateStringOrNumber } from '../utils/validators.js';
import type { Biblio } from './types.js';

const BIBLIO_KEYS = ['volume', 'issue', 'first_page', 'last_page'];

/**
 * Validate Biblio object
 *
 * https://docs.openalex.org/about-the-data/work#biblio
 */
export function validateBiblio(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: BIBLIO_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: Biblio = {};
  if (defined(value.volume)) {
    output.volume = validateStringOrNumber(value.volume, incrementOptions('volume', opts));
  }
  if (defined(value.issue)) {
    output.issue = validateStringOrNumber(value.issue, incrementOptions('issue', opts));
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
  return output;
}
