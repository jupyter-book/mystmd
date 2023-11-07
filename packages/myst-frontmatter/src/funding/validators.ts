import {
  defined,
  incrementOptions,
  validateKeys,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
} from 'simple-validators';
import type { ValidationOptions } from 'simple-validators';
import type { Award, Funding } from './types.js';
import type { ReferenceStash } from '../index.js';
import { validateAffiliation, validateAndStashObject, validateContributor } from '../index.js';

const AWARD_KEYS = ['id', 'name', 'description', 'sources', 'recipients', 'investigators'];
const AWARD_ALIASES = { source: 'sources', recipient: 'recipients', investigator: 'investigators' };
const FUNDING_KEYS = ['statement', 'open_access', 'awards'];
const FUNDING_ALIASES = { award: 'awards' };

/**
 * Validate Award object against the schema
 *
 * Award sources (institutions) get added to affiliations list and
 * award recipients/investigators get added to authors list.
 */
export function validateAward(input: any, stash: ReferenceStash, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: AWARD_KEYS, alias: AWARD_ALIASES }, opts);
  if (value === undefined) return undefined;
  const output: Award = {};
  if (defined(value.id)) {
    output.id = validateString(value.id, { ...incrementOptions('id', opts), coerceNumber: true });
  }
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.sources)) {
    output.sources = validateList(
      value.sources,
      { coerce: true, ...incrementOptions('sources', opts) },
      (source, index) => {
        return validateAndStashObject(
          source,
          stash,
          'affiliations',
          validateAffiliation,
          incrementOptions(`sources.${index}`, opts),
        );
      },
    );
  }
  if (defined(value.recipients)) {
    output.recipients = validateList(
      value.recipients,
      { coerce: true, ...incrementOptions('recipients', opts) },
      (recipient, index) => {
        return validateAndStashObject(
          recipient,
          stash,
          'contributors',
          (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
          incrementOptions(`recipients.${index}`, opts),
        );
      },
    );
  }
  if (defined(value.investigators)) {
    output.investigators = validateList(
      value.investigators,
      { coerce: true, ...incrementOptions('investigators', opts) },
      (investigator, index) => {
        return validateAndStashObject(
          investigator,
          stash,
          'contributors',
          (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
          incrementOptions(`investigators.${index}`, opts),
        );
      },
    );
  }
  return output;
}

/**
 * Validate Funding object against the schema
 *
 * Valid input may be:
 * - a string (which becomes funding statement)
 * - an award
 * - a full funding object
 */
export function validateFunding(input: any, stash: ReferenceStash, opts: ValidationOptions) {
  if (typeof input === 'string') {
    input = { statement: input };
  }
  const valueAsObj = validateObject(input, opts);
  if (valueAsObj === undefined) return undefined;
  const value = validateKeys(
    valueAsObj,
    { optional: FUNDING_KEYS, alias: FUNDING_ALIASES },
    { ...opts, suppressErrors: true, suppressWarnings: true },
  );
  if (value === undefined) return undefined;
  if (!value.awards) {
    // Handle case where award fields are defined directly on funding.
    // Do not warn on funding OR award keys.
    validateKeys(
      valueAsObj,
      {
        optional: [...FUNDING_KEYS, ...AWARD_KEYS],
        alias: { ...FUNDING_ALIASES, ...AWARD_ALIASES },
      },
      opts,
    );
    const valueAsAward = validateObjectKeys(
      input,
      { optional: AWARD_KEYS, alias: AWARD_ALIASES },
      { ...opts, suppressErrors: true, suppressWarnings: true },
    );
    if (valueAsAward && Object.keys(valueAsAward).length > 0) {
      value.awards = [
        validateObjectKeys(
          input,
          { optional: AWARD_KEYS, alias: AWARD_ALIASES },
          { ...opts, suppressErrors: true, suppressWarnings: true },
        ),
      ];
    }
  } else {
    // Handle case where award fields are defined directly on funding.
    // Only do not warn on funding keys.
    validateKeys(valueAsObj, { optional: FUNDING_KEYS, alias: FUNDING_ALIASES }, opts);
  }
  const output: Funding = {};
  if (defined(value.statement)) {
    output.statement = validateString(value.statement, incrementOptions('statement', opts));
  }
  if (defined(value.open_access)) {
    output.open_access = validateString(value.open_access, incrementOptions('open_access', opts));
  }
  if (defined(value.awards)) {
    output.awards = validateList(
      value.awards,
      { coerce: true, ...incrementOptions('awards', opts) },
      (award, index) => {
        return validateAward(award, stash, incrementOptions(`awards.${index}`, opts));
      },
    );
  }
  return output;
}
