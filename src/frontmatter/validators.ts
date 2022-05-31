import { validate } from 'doi-utils';
import { validateLicenses } from '../licenses/validators';
import {
  defined,
  incrementOptions,
  Options,
  validateBoolean,
  validateDate,
  validateEmail,
  validateKeys,
  validateList,
  validateObject,
  validateString,
  validateUrl,
  validationError,
} from '../utils/validators';
import {
  Author,
  Biblio,
  Numbering,
  PageFrontmatter,
  ProjectFrontmatter,
  SiteFrontmatter,
  Venue,
} from './types';

const CRT_CONTRIBUTOR_ROLES = [
  'conceptualization',
  'data curation',
  'formal Analysis',
  'funding acquisition',
  'investigation',
  'methodology',
  'project administration',
  'resources',
  'software',
  'supervision',
  'validation',
  'visualization',
  'writing – original draft', // U+2013 hyphen is used in CRT spec
  'writing – review & editing',
  'writing - original draft', // U+002d hyphen is also allowed
  'writing - review & editing',
];

export const SITE_FRONTMATTER_KEYS = ['title', 'description', 'venue'];
export const PROJECT_FRONTMATTER_KEYS = [
  'authors',
  'name',
  'doi',
  'arxiv',
  'open_access',
  'licenses',
  'github',
  'binder',
  'subject',
  'biblio',
  'oxa',
  'numbering',
  'math',
].concat(SITE_FRONTMATTER_KEYS);
export const PAGE_FRONTMATTER_KEYS = ['subtitle', 'short_title', 'date'].concat(
  PROJECT_FRONTMATTER_KEYS,
);

export const USE_PROJECT_FALLBACK = [
  'authors',
  'doi',
  'arxiv',
  'open_access',
  'licenses',
  'github',
  'binder',
  'subject',
  'venue',
  'biblio',
  'numbering',
];

const AUTHOR_KEYS = ['userId', 'name', 'orcid', 'corresponding', 'email', 'roles', 'affiliations'];
const BIBLIO_KEYS = ['volume', 'issue', 'first_page', 'last_page'];
const NUMBERING_KEYS = [
  'enumerator',
  'figure',
  'equation',
  'table',
  'code',
  'heading_1',
  'heading_2',
  'heading_3',
  'heading_4',
  'heading_5',
  'heading_6',
];

const GITHUB_USERNAME_REPO_REGEX = '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$';
const ORCID_REGEX = '^(http(s)?://orcid.org/)?([0-9]{4}-){3}[0-9]{3}[0-9X]$';

/**
 * Validate Venue object against the schema
 *
 * If 'value' is a string, venue will be coerced to object { title: value }
 */
export function validateVenue(input: any, opts: Options) {
  let titleOpts: Options;
  if (typeof input === 'string') {
    input = { title: input };
    titleOpts = opts;
  } else {
    // This means 'venue.title' only shows up in errors if present in original input
    titleOpts = incrementOptions('title', opts);
  }
  let value = validateObject(input, opts);
  value = validateKeys(value, { optional: ['title', 'url'] }, opts);
  if (defined(value.title)) {
    value.title = validateString(value.title, titleOpts);
  }
  if (defined(value.url)) {
    value.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  return value as Venue;
}

/**
 * Validate Author object against the schema
 */
export function validateAuthor(input: any, opts: Options) {
  let value = validateObject(input, opts);
  value = validateKeys(value, { optional: AUTHOR_KEYS }, opts);
  if (defined(value.userId)) {
    // TODO: Better userId validation - length? regex?
    value.userId = validateString(value.userId, incrementOptions('userId', opts));
  }
  if (defined(value.name)) {
    value.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.orcid)) {
    value.orcid = validateString(value.orcid, {
      ...incrementOptions('orcid', opts),
      regex: ORCID_REGEX,
    });
  }
  if (defined(value.corresponding)) {
    value.corresponding = validateBoolean(
      value.corresponding,
      incrementOptions('corresponding', opts),
    );
    if (value.corresponding && !defined(value.email)) {
      throw validationError(`must include email for corresponding author`, opts);
    }
  }
  if (defined(value.email)) {
    value.email = validateEmail(value.email, incrementOptions('email', opts));
  }
  if (defined(value.roles)) {
    const rolesOpts = incrementOptions('roles', opts);
    value.roles = validateList(value.roles, rolesOpts).map((role) => {
      role = validateString(role, rolesOpts);
      if (!CRT_CONTRIBUTOR_ROLES.includes(role.toLowerCase())) {
        throw validationError(
          `invalid value "${role}" - must be CRT contributor roles - see https://casrai.org/credit/`,
          rolesOpts,
        );
      }
      return role;
    });
  }
  if (defined(value.affiliations)) {
    const affiliationsOpts = incrementOptions('affiliations', opts);
    value.affiliations = validateList(value.affiliations, affiliationsOpts).map((aff) => {
      return validateString(aff, affiliationsOpts);
    });
  }
  return value as Author;
}

function validateStringOrNumber(input: any, opts: Options) {
  if (typeof input === 'string') return validateString(input, opts);
  if (typeof input === 'number') return input;
  throw validationError('must be string or number', opts);
}

/**
 * Validate Biblio object
 *
 * https://docs.openalex.org/about-the-data/work#biblio
 */
export function validateBiblio(input: any, opts: Options) {
  let value = validateObject(input, opts);
  value = validateKeys(value, { optional: BIBLIO_KEYS }, opts);
  if (defined(value.volume)) {
    value.volume = validateStringOrNumber(value.volume, incrementOptions('volume', opts));
  }
  if (defined(value.issue)) {
    value.issue = validateStringOrNumber(value.issue, incrementOptions('issue', opts));
  }
  if (defined(value.first_page)) {
    value.first_page = validateStringOrNumber(
      value.first_page,
      incrementOptions('first_page', opts),
    );
  }
  if (defined(value.last_page)) {
    value.last_page = validateStringOrNumber(value.last_page, incrementOptions('last_page', opts));
  }
  return value as Biblio;
}

/**
 * Validate Numbering object
 */
export function validateNumbering(input: any, opts: Options) {
  let value = validateObject(input, opts);
  value = validateKeys(value, { optional: NUMBERING_KEYS }, opts);
  if (defined(value.enumerator)) {
    value.enumerator = validateString(value.enumerator, incrementOptions('enumerator', opts));
  }
  NUMBERING_KEYS.filter((key) => key !== 'enumerator').forEach((key) => {
    if (defined(value[key])) {
      value[key] = validateBoolean(value[key], incrementOptions(key, opts));
    }
  });
  return value as Numbering;
}

/**
 * Validate SiteFrontmatter object against the schema
 */
export function validateSiteFrontmatter(input: any, opts: Options) {
  let value = validateObject(input, opts);
  value = validateKeys(value, { optional: SITE_FRONTMATTER_KEYS }, opts);
  if (defined(value.title)) {
    value.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    value.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.venue)) {
    value.venue = validateVenue(value.venue, incrementOptions('venue', opts));
  }
  return value as SiteFrontmatter;
}

/**
 * Validate ProjectFrontmatter object against the schema
 */
export function validateProjectFrontmatter(input: any, opts: Options) {
  const siteFrontmatter = validateSiteFrontmatter(input, { ...opts, warn: false });
  let value = validateObject(input, opts);
  value = validateKeys(value, { optional: PROJECT_FRONTMATTER_KEYS }, opts);
  if (defined(value.authors)) {
    const authorsOpts = incrementOptions('authors', opts);
    value.authors = validateList(value.authors, authorsOpts).map((author) => {
      return validateAuthor(author, authorsOpts);
    });
  }
  if (defined(value.name)) {
    value.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.doi)) {
    const doiOpts = incrementOptions('doi', opts);
    value.doi = validateString(value.doi, doiOpts);
    if (!validate(value.doi)) {
      throw validationError('must be valid DOI', doiOpts);
    }
  }
  if (defined(value.arxiv)) {
    value.arxiv = validateUrl(value.arxiv, {
      ...incrementOptions('arxiv', opts),
      includes: 'arxiv.org',
    });
  }
  if (defined(value.open_accesss)) {
    value.open_access = validateBoolean(value.open_access, incrementOptions('open_access', opts));
  }
  if (defined(value.licenses)) {
    value.licenses = validateLicenses(value.licenses, incrementOptions('licenses', opts));
  }
  if (defined(value.github)) {
    if (typeof value.github === 'string') {
      const repo = value.github.match(GITHUB_USERNAME_REPO_REGEX);
      if (repo) {
        value.github = `https://github.com/${repo}`;
      }
    }
    value.github = validateUrl(value.github, {
      ...incrementOptions('github', opts),
      includes: 'github',
    });
  }
  if (defined(value.binder)) {
    value.binder = validateUrl(value.binder, incrementOptions('binder', opts));
  }
  if (defined(value.subject)) {
    value.subject = validateString(value.subject, incrementOptions('subject', opts));
  }
  if (defined(value.biblio)) {
    value.biblio = validateBiblio(value.biblio, incrementOptions('biblio', opts));
  }
  if (defined(value.oxa)) {
    // TODO: better oxa validation
    value.oxa = validateString(value.oxa, incrementOptions('oxa', opts));
  }
  if (defined(value.numbering)) {
    const numberingOpts = incrementOptions('numbering', opts);
    try {
      value.numbering = validateBoolean(value.numbering, numberingOpts);
    } catch (err) {
      value.numbering = validateNumbering(value.numbering, numberingOpts);
    }
  }
  if (defined(value.math)) {
    const mathOpts = incrementOptions('math', opts);
    const math = validateObject(value.math, mathOpts);
    Object.keys(math).forEach((key) => {
      validateString(math[key], incrementOptions(key, mathOpts));
    });
    value.math = math as Record<string, string>;
  }
  return { ...siteFrontmatter, ...value } as ProjectFrontmatter;
}

/**
 * Validate PageFrontmatter object against the schema
 */
export function validatePageFrontmatter(input: any, opts: Options) {
  const projectFrontmatter = validateProjectFrontmatter(input, { ...opts, warn: false });
  let value = validateObject(input, opts);
  value = validateKeys(value, { optional: PAGE_FRONTMATTER_KEYS }, opts);
  if (defined(value.subtitle)) {
    value.subtitle = validateString(value.subtitle, incrementOptions('subtitle', opts));
  }
  if (defined(value.short_title)) {
    value.short_title = validateString(value.short_title, incrementOptions('short_title', opts));
  }
  if (defined(value.date)) {
    value.date = validateDate(value.date, incrementOptions('date', opts));
  }
  return { ...projectFrontmatter, ...value } as PageFrontmatter;
}

/**
 * Copy 'base' object and fill any 'keys' that are missing with their values from 'filler'
 */
export function fillMissingKeys<T extends Record<string, any>>(
  base: T,
  filler: T,
  keys: (keyof T | string)[],
): T {
  const output: T = { ...base };
  keys.forEach((key) => {
    if (!defined(output[key]) && defined(filler[key])) {
      key = key as keyof T;
      output[key] = filler[key];
    }
  });
  return output;
}

/**
 * Fill missing values from page frontmatter object with values from project frontmatter
 *
 * This only applies to frontmatter values where overriding is the correct behavior.
 * For example, if page has no 'title' the project 'title' is not filled in.
 */
export function fillPageFrontmatter(
  pageFrontmatter: PageFrontmatter,
  projectFrontmatter: ProjectFrontmatter,
) {
  // TODO: Anything with SiteFrontmatter? Maybe 'site.venue' overrides other venues?
  //       Or 'site.title' is used if no other title is available on project/page?
  const frontmatter = fillMissingKeys(pageFrontmatter, projectFrontmatter, USE_PROJECT_FALLBACK);

  // If numbering is an object, combine page and project settings.
  // Otherwise, the value filled above is correct.
  if (
    typeof pageFrontmatter.numbering === 'object' &&
    typeof projectFrontmatter.numbering === 'object'
  ) {
    frontmatter.numbering = fillMissingKeys(
      pageFrontmatter.numbering,
      projectFrontmatter.numbering,
      NUMBERING_KEYS,
    );
  }

  // Combine all math macros defined on page and project
  if (projectFrontmatter.math || pageFrontmatter.math) {
    frontmatter.math = { ...(projectFrontmatter.math ?? {}), ...(pageFrontmatter.math ?? {}) };
  }

  return frontmatter;
}
