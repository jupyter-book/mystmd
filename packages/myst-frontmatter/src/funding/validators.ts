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
import type { ReferenceStash } from '../frontmatter/types.js';
import type { Award, Funding } from './types.js';
import { stashPlaceholder, validateAffiliation, validateContributor } from '../index.js';

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
    // Sources may be looked up from affiliations stash, but new sources are not saved.
    const sources = Array.isArray(value.sources) ? value.sources : [value.sources];
    output.sources = validateList(sources, incrementOptions('sources', opts), (source, index) => {
      if (typeof source === 'string') {
        const idMatch = stash.affiliations?.find((aff) => aff.id === source);
        if (idMatch) return idMatch;
        source = stashPlaceholder(source);
      }
      return validateAffiliation(source, incrementOptions(`sources.${index}`, opts));
    });
  }
  if (defined(value.recipients)) {
    // Recipients may be looked up from either affiliations or contributors stash,
    // but new recipients are not saved.
    const recipients = Array.isArray(value.recipients) ? value.recipients : [value.recipients];
    output.recipients = validateList(
      recipients,
      incrementOptions('recipients', opts),
      (recipient, index) => {
        if (typeof recipient === 'string') {
          const idMatch =
            stash.contributors?.find((contrib) => contrib.id === recipient) ??
            stash.affiliations?.find((aff) => aff.id === recipient);
          if (idMatch) return idMatch;
          recipient = stashPlaceholder(recipient);
        }
        const suppressedOpts = {
          ...opts,
          suppressErrors: true,
          suppressWarnings: true,
        };
        const asContrib = validateContributor(recipient, undefined, suppressedOpts);
        const asAff = validateAffiliation(recipient, suppressedOpts);
        const incrementedOpts = incrementOptions(`recipients.${index}`, opts);
        // Decide if this is an affiliation or a contributor. It is a contributor if:
        //   - affiliation validation fails
        //   - affiliation and contributor validation pass, but contributor has more valid keys.
        //     (this accounts for the addition of `nameParsed` to contributor)
        if (!asAff || (asContrib && Object.keys(asAff).length < Object.keys(asContrib).length)) {
          return validateContributor(recipient, undefined, incrementedOpts);
        }
        return validateAffiliation(recipient, incrementedOpts);
      },
    );
  }
  if (defined(value.investigators)) {
    // Investigators may be looked up from affiliations stash, but new investigators are not saved.
    const investigators = Array.isArray(value.investigators)
      ? value.investigators
      : [value.investigators];
    output.investigators = validateList(
      investigators,
      incrementOptions('investigators', opts),
      (investigator, index) => {
        if (typeof investigator === 'string') {
          const idMatch = stash.contributors?.find((aff) => aff.id === investigator);
          if (idMatch) return idMatch;
          investigator = stashPlaceholder(investigator);
        }
        return validateContributor(
          investigator,
          undefined,
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
    const awards = Array.isArray(value.awards) ? value.awards : [value.awards];
    output.awards = validateList(awards, incrementOptions('awards', opts), (award, index) => {
      return validateAward(award, stash, incrementOptions(`awards.${index}`, opts));
    });
  }
  return output;
}
