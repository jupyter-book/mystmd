import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
  validationError,
} from 'simple-validators';
import { validateAffiliation } from '../affiliations/validators.js';
import { validateContributor } from '../contributors/validators.js';
import { validateFunding } from '../funding/validators.js';
import type { ReferenceStash } from '../utils/referenceStash.js';
import { validateAndStashObject } from '../utils/referenceStash.js';
import { validateGithubUrl } from '../utils/validators.js';
import { validateVenue } from '../venues/validators.js';
import { FRONTMATTER_ALIASES, PAGE_KNOWN_PARTS, type SiteFrontmatter } from './types.js';
import { RESERVED_EXPORT_KEYS } from '../exports/validators.js';

export function validateSiteFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: SiteFrontmatter = {};
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.short_title)) {
    output.short_title = validateString(value.short_title, incrementOptions('short_title', opts));
  }
  if (defined(value.subtitle)) {
    output.subtitle = validateString(value.subtitle, incrementOptions('subtitle', opts));
  }
  if (value.banner === null) {
    // It is possible for the banner to explicitly be null.
    // This means not to look to the images in a page.
    output.banner = null;
  } else if (defined(value.banner)) {
    output.banner = validateString(value.banner, incrementOptions('banner', opts));
  }
  if (defined(value.bannerOptimized)) {
    // No validation, this is expected to be set programmatically
    output.bannerOptimized = value.bannerOptimized;
  }
  if (defined(value.tags)) {
    output.tags = validateList(
      value.tags,
      incrementOptions('tags', opts),
      (file, index: number) => {
        return validateString(file, incrementOptions(`tags.${index}`, opts));
      },
    );
  }
  const stash: ReferenceStash = {};
  if (defined(value.affiliations)) {
    const affiliationsOpts = incrementOptions('affiliations', opts);
    let affiliations = value.affiliations;
    if (typeof affiliations === 'string') {
      affiliations = affiliations.split(';').map((aff) => aff.trim());
    }
    validateList(affiliations, affiliationsOpts, (aff) => {
      return validateAndStashObject(
        aff,
        stash,
        'affiliations',
        validateAffiliation,
        affiliationsOpts,
      );
    });
  }
  if (defined(value.authors)) {
    stash.authorIds = validateList(
      value.authors,
      { coerce: true, ...incrementOptions('authors', opts) },
      (author, index) => {
        return validateAndStashObject(
          author,
          stash,
          'contributors',
          (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
          incrementOptions(`authors.${index}`, opts),
        );
      },
    );
  }
  if (defined(value.contributors)) {
    // In addition to contributors defined here, additional contributors may be defined elsewhere
    // in the frontmatter (e.g. funding award investigator/recipient). These extra contributors
    // are combined with this list at the end of validation.
    validateList(
      value.contributors,
      { coerce: true, ...incrementOptions('contributors', opts) },
      (contributor, index) => {
        return validateAndStashObject(
          contributor,
          stash,
          'contributors',
          (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
          incrementOptions(`contributors.${index}`, opts),
        );
      },
    );
  }
  if (defined(value.reviewers)) {
    output.reviewers = validateList(
      value.reviewers,
      { coerce: true, ...incrementOptions('reviewers', opts) },
      (reviewer, ind) => {
        return validateAndStashObject(
          reviewer,
          stash,
          'contributors',
          (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
          incrementOptions(`reviewers.${ind}`, opts),
        );
      },
    );
  }
  if (defined(value.editors)) {
    output.editors = validateList(
      value.editors,
      { coerce: true, ...incrementOptions('editors', opts) },
      (editor, ind) => {
        return validateAndStashObject(
          editor,
          stash,
          'contributors',
          (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
          incrementOptions(`editors.${ind}`, opts),
        );
      },
    );
  }
  if (defined(value.venue)) {
    output.venue = validateVenue(value.venue, incrementOptions('venue', opts));
  }
  if (defined(value.github)) {
    output.github = validateGithubUrl(value.github, incrementOptions('github', opts));
  }
  if (defined(value.keywords)) {
    let keywords = value.keywords;
    if (typeof keywords === 'string') {
      keywords = keywords.split(/[,;]/).map((k) => k.trim());
    }
    output.keywords = validateList(keywords, incrementOptions('keywords', opts), (word, ind) => {
      return validateString(word, incrementOptions(`keywords.${ind}`, opts));
    });
  }
  if (defined(value.funding)) {
    output.funding = validateList(
      value.funding,
      { coerce: true, ...incrementOptions('funding', opts) },
      (fund, index) => {
        return validateFunding(fund, stash, incrementOptions(`funding.${index}`, opts));
      },
    );
  }
  if (defined(value.copyright)) {
    output.copyright = validateString(value.copyright, incrementOptions('copyright', opts));
  }
  if (defined(value.options)) {
    const optionsOptions = incrementOptions('options', opts);
    const options = validateObject(value.options, optionsOptions);
    if (options) {
      Object.entries(options).forEach(([key, val]) => {
        if (RESERVED_EXPORT_KEYS.includes(key)) {
          validationError(`options cannot include reserved key ${key}`, optionsOptions);
        } else {
          (output.options ??= {})[key] = val;
        }
      });
    }
  }
  const partsOptions = incrementOptions('parts', opts);
  let parts: Record<string, any> | undefined;
  if (defined(value.parts)) {
    parts = validateObjectKeys(
      value.parts,
      { optional: PAGE_KNOWN_PARTS, alias: FRONTMATTER_ALIASES },
      { keepExtraKeys: true, suppressWarnings: true, ...partsOptions },
    );
  }
  PAGE_KNOWN_PARTS.forEach((partKey) => {
    if (defined(value[partKey])) {
      parts ??= {};
      if (parts[partKey]) {
        validationError(`duplicate value for part ${partKey}`, partsOptions);
      } else {
        parts[partKey] = value[partKey];
      }
    }
  });
  if (parts) {
    const partsEntries = Object.entries(parts)
      .map(([k, v]) => {
        return [
          k,
          validateList(v, { coerce: true, ...incrementOptions(k, partsOptions) }, (item, index) => {
            return validateString(item, incrementOptions(`${k}.${index}`, partsOptions));
          }),
        ];
      })
      .filter((entry): entry is [string, string[]] => !!entry[1]?.length);
    if (partsEntries.length > 0) {
      output.parts = Object.fromEntries(partsEntries);
    }
  }

  // Author/Contributor/Affiliation resolution should happen last
  const stashContribAuthors = stash.contributors?.filter((contrib) =>
    stash.authorIds?.includes(contrib.id),
  );
  const stashContribNonAuthors = stash.contributors?.filter(
    (contrib) => !stash.authorIds?.includes(contrib.id),
  );
  if (stashContribAuthors?.length) {
    output.authors = stashContribAuthors;
    // Ensure there is a corresponding author if an email is provided
    const correspondingAuthor = output.authors?.find((a) => a.corresponding);
    const personWithEmail = output.authors?.find(
      (a) => a.email && !a.collaboration && a.corresponding === undefined,
    );
    if (!correspondingAuthor && personWithEmail) {
      personWithEmail.corresponding = true;
    }
  }
  if (stashContribNonAuthors?.length) {
    output.contributors = stashContribNonAuthors;
  }
  if (stash.affiliations?.length) {
    output.affiliations = stash.affiliations;
  }
  return output;
}
