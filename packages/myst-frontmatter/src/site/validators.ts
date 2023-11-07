import type { ValidationOptions } from 'simple-validators';
import { defined, incrementOptions, validateList, validateString } from 'simple-validators';
import { validateAffiliation } from '../affiliations/validators.js';
import { validateContributor } from '../contributors/validators.js';
import { validateFunding } from '../funding/validators.js';
import type { ReferenceStash } from '../utils/referenceStash.js';
import { validateAndStashObject } from '../utils/referenceStash.js';
import { validateGithubUrl } from '../utils/validators.js';
import { validateVenue } from '../venues/validators.js';
import type { SiteFrontmatter } from './types.js';

export const SITE_FRONTMATTER_KEYS = [
  'title',
  'subtitle',
  'short_title',
  'description',
  'thumbnail',
  'thumbnailOptimized',
  'banner',
  'bannerOptimized',
  'authors',
  'contributors',
  'venue',
  'github',
  'keywords',
  'affiliations',
  'funding',
];

export const FRONTMATTER_ALIASES = {
  author: 'authors',
  contributor: 'contributors',
  affiliation: 'affiliations',
  export: 'exports',
  jupyter: 'thebe',
};

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
    const funding = Array.isArray(value.funding) ? value.funding : [value.funding];
    output.funding = validateList(
      funding,
      { coerce: true, ...incrementOptions('funding', opts) },
      (fund, index) => {
        return validateFunding(fund, stash, incrementOptions(`funding.${index}`, opts));
      },
    );
  }
  const stashContribAuthors = stash.contributors?.filter(
    (contrib) => stash.authorIds?.includes(contrib.id),
  );
  const stashContribNonAuthors = stash.contributors?.filter(
    (contrib) => !stash.authorIds?.includes(contrib.id),
  );
  if (stashContribAuthors?.length) {
    output.authors = stashContribAuthors;
    // Ensure there is a corresponding author if an email is provided
    const corresponding = output.authors?.find((a) => a.corresponding !== undefined);
    const email = output.authors?.find((a) => a.email);
    if (!corresponding && email) {
      email.corresponding = true;
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
