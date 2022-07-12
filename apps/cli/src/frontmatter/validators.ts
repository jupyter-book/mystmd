import { validate } from 'doi-utils';
import { validateLicenses } from '../licenses/validators';
import {
  defined,
  incrementOptions,
  fillMissingKeys,
  filterKeys,
  Options,
  validateBoolean,
  validateDate,
  validateEmail,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationError,
} from '../utils/validators';
import {
  Author,
  Biblio,
  Jupytext,
  KernelSpec,
  Numbering,
  PageFrontmatter,
  ProjectFrontmatter,
  SiteFrontmatter,
  TextRepresentation,
  Venue,
} from './types';

const CRT_CONTRIBUTOR_ROLES = [
  'conceptualization',
  'data curation',
  'formal analysis',
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
  'date',
  'name',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'github',
  'binder',
  'subject',
  'biblio',
  'oxa',
  'numbering',
  'math',
].concat(SITE_FRONTMATTER_KEYS);
export const PAGE_FRONTMATTER_KEYS = [
  'subtitle',
  'short_title',
  'kernelspec',
  'jupytext',
  'tags',
  'thumbnail',
].concat(PROJECT_FRONTMATTER_KEYS);

export const USE_SITE_FALLBACK = ['venue'];
export const USE_PROJECT_FALLBACK = [
  'authors',
  'date',
  'doi',
  'arxiv',
  'open_access',
  'license',
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
const KERNELSPEC_KEYS = ['name', 'language', 'display_name', 'argv', 'env'];
const TEXT_REPRESENTATION_KEYS = ['extension', 'format_name', 'format_version', 'jupytext_version'];
const JUPYTEXT_KEYS = ['formats', 'text_representation'];

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
  const value = validateObjectKeys(input, { optional: ['title', 'url'] }, opts);
  if (value === undefined) return undefined;
  const output: Venue = {};
  if (defined(value.title)) {
    output.title = validateString(value.title, titleOpts);
  }
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  return output;
}

/**
 * Validate Author object against the schema
 */
export function validateAuthor(input: any, opts: Options) {
  const value = validateObjectKeys(input, { optional: AUTHOR_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: Author = {};
  if (defined(value.userId)) {
    // TODO: Better userId validation - length? regex?
    output.userId = validateString(value.userId, incrementOptions('userId', opts));
  }
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.orcid)) {
    output.orcid = validateString(value.orcid, {
      ...incrementOptions('orcid', opts),
      regex: ORCID_REGEX,
    });
  }
  if (defined(value.corresponding)) {
    const correspondingOpts = incrementOptions('corresponding', opts);
    output.corresponding = validateBoolean(value.corresponding, correspondingOpts);
    if (value.corresponding && !defined(value.email)) {
      validationError(`must include email for corresponding author`, correspondingOpts);
      output.corresponding = false;
    }
  }
  if (defined(value.email)) {
    output.email = validateEmail(value.email, incrementOptions('email', opts));
  }
  if (defined(value.roles)) {
    const rolesOpts = incrementOptions('roles', opts);
    output.roles = validateList(value.roles, rolesOpts, (r) => {
      const role = validateString(r, rolesOpts);
      if (role === undefined) return undefined;
      if (!CRT_CONTRIBUTOR_ROLES.includes(role.toLowerCase())) {
        return validationError(
          `invalid value "${role}" - must be CRT contributor roles - see https://casrai.org/credit/`,
          rolesOpts,
        );
      }
      return role;
    });
  }
  if (defined(value.affiliations)) {
    const affiliationsOpts = incrementOptions('affiliations', opts);
    output.affiliations = validateList(value.affiliations, affiliationsOpts, (aff) => {
      return validateString(aff, affiliationsOpts);
    });
  }
  return output;
}

function validateStringOrNumber(input: any, opts: Options) {
  if (typeof input === 'string') return validateString(input, opts);
  if (typeof input === 'number') return input;
  return validationError('must be string or number', opts);
}

/**
 * Validate Biblio object
 *
 * https://docs.openalex.org/about-the-data/work#biblio
 */
export function validateBiblio(input: any, opts: Options) {
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

/**
 * Validate Numbering object
 */
export function validateNumbering(input: any, opts: Options) {
  const value = validateObjectKeys(input, { optional: NUMBERING_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: Record<string, any> = {};
  if (defined(value.enumerator)) {
    output.enumerator = validateString(value.enumerator, incrementOptions('enumerator', opts));
  }
  NUMBERING_KEYS.filter((key) => key !== 'enumerator').forEach((key) => {
    if (defined(value[key])) {
      output[key] = validateBoolean(value[key], incrementOptions(key, opts));
    }
  });
  return output as Numbering;
}

/**
 * Validate KernelSpec object
 */
export function validateKernelSpec(input: any, opts: Options) {
  const value = validateObjectKeys(input, { optional: KERNELSPEC_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: KernelSpec = {};
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.language)) {
    output.language = validateString(value.language, incrementOptions('language', opts));
  }
  if (defined(value.display_name)) {
    output.display_name = validateString(
      value.display_name,
      incrementOptions('display_name', opts),
    );
  }
  if (defined(value.env)) {
    output.env = validateObject(value.env, incrementOptions('env', opts));
  }
  if (defined(value.argv)) {
    output.argv = validateList(value.argv, incrementOptions('argv', opts), (arg, index) => {
      return validateString(arg, incrementOptions(`argv.${index}`, opts));
    });
  }
  return output;
}

function validateTextRepresentation(input: any, opts: Options) {
  const value = validateObjectKeys(input, { optional: TEXT_REPRESENTATION_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: TextRepresentation = {};
  if (defined(value.extension)) {
    output.extension = validateString(value.extension, incrementOptions('extension', opts));
  }
  if (defined(value.format_name)) {
    output.format_name = validateString(value.format_name, incrementOptions('format_name', opts));
  }
  if (defined(value.format_version)) {
    // The format version ocassionally comes as a number in YAML, treat it as a string
    const format_version =
      typeof value.format_version === 'number'
        ? String(value.format_version)
        : value.format_version;
    output.format_version = validateString(
      format_version,
      incrementOptions('format_version', opts),
    );
  }
  if (defined(value.jupytext_version)) {
    output.jupytext_version = validateString(
      value.jupytext_version,
      incrementOptions('jupytext_version', opts),
    );
  }
  return output;
}

/**
 * Validate Jupytext object
 *
 * https://jupyterbook.org/en/stable/file-types/myst-notebooks.html
 */
export function validateJupytext(input: any, opts: Options) {
  const value = validateObjectKeys(input, { optional: JUPYTEXT_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: Jupytext = {};
  if (defined(value.formats)) {
    output.formats = validateString(value.formats, incrementOptions('formats', opts));
  }
  if (defined(value.text_representation)) {
    output.text_representation = validateTextRepresentation(
      value.text_representation,
      incrementOptions('text_representation', opts),
    );
  }
  return output;
}

export function validateSiteFrontmatterKeys(value: Record<string, any>, opts: Options) {
  const output: SiteFrontmatter = {};
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.venue)) {
    output.venue = validateVenue(value.venue, incrementOptions('venue', opts));
  }
  return output;
}

export function validateProjectFrontmatterKeys(value: Record<string, any>, opts: Options) {
  const output: ProjectFrontmatter = validateSiteFrontmatterKeys(value, opts);
  if (defined(value.authors)) {
    output.authors = validateList(
      value.authors,
      incrementOptions('authors', opts),
      (author, index) => {
        return validateAuthor(author, incrementOptions(`authors.${index}`, opts));
      },
    );
  }
  if (defined(value.date)) {
    output.date = validateDate(value.date, incrementOptions('date', opts));
  }
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.doi)) {
    const doiOpts = incrementOptions('doi', opts);
    const doi = validateString(value.doi, doiOpts);
    if (doi !== undefined) {
      if (validate(doi)) {
        output.doi = doi;
      } else {
        validationError('must be valid DOI', doiOpts);
      }
    }
  }
  if (defined(value.arxiv)) {
    output.arxiv = validateUrl(value.arxiv, {
      ...incrementOptions('arxiv', opts),
      includes: 'arxiv.org',
    });
  }
  if (defined(value.open_access)) {
    output.open_access = validateBoolean(value.open_access, incrementOptions('open_access', opts));
  }
  if (defined(value.license)) {
    output.license = validateLicenses(value.license, incrementOptions('license', opts));
  }
  if (defined(value.github)) {
    let { github } = value;
    if (typeof github === 'string') {
      const repo = github.match(GITHUB_USERNAME_REPO_REGEX);
      if (repo) {
        github = `https://github.com/${repo}`;
      }
    }
    output.github = validateUrl(github, {
      ...incrementOptions('github', opts),
      includes: 'github',
    });
  }
  if (defined(value.binder)) {
    output.binder = validateUrl(value.binder, incrementOptions('binder', opts));
  }
  if (defined(value.subject)) {
    output.subject = validateString(value.subject, {
      ...incrementOptions('subject', opts),
      maxLength: 40,
    });
  }
  if (defined(value.biblio)) {
    output.biblio = validateBiblio(value.biblio, incrementOptions('biblio', opts));
  }
  if (defined(value.oxa)) {
    // TODO: better oxa validation
    output.oxa = validateString(value.oxa, incrementOptions('oxa', opts));
  }
  if (defined(value.numbering)) {
    const numberingOpts = incrementOptions('numbering', opts);
    let numbering: boolean | Numbering | undefined = validateBoolean(value.numbering, {
      ...numberingOpts,
      suppressWarnings: true,
      suppressErrors: true,
    });
    // TODO: could add an error here for validation of a non-bool non-object
    if (numbering === undefined) {
      numbering = validateNumbering(value.numbering, numberingOpts);
    }
    if (numbering !== undefined) {
      output.numbering = numbering;
    }
  }
  if (defined(value.math)) {
    const mathOpts = incrementOptions('math', opts);
    const math = validateObject(value.math, mathOpts);
    if (math) {
      const stringKeys = Object.keys(math).filter((key) => {
        // Filter on non-string values
        return validateString(math[key], incrementOptions(key, mathOpts));
      });
      output.math = filterKeys(math, stringKeys);
    }
  }
  return output;
}

export function validatePageFrontmatterKeys(value: Record<string, any>, opts: Options) {
  const output: PageFrontmatter = validateProjectFrontmatterKeys(value, opts);
  if (defined(value.subtitle)) {
    output.subtitle = validateString(value.subtitle, incrementOptions('subtitle', opts));
  }
  if (defined(value.short_title)) {
    output.short_title = validateString(value.short_title, {
      ...incrementOptions('short_title', opts),
      maxLength: 40,
    });
  }
  if (defined(value.kernelspec)) {
    output.kernelspec = validateKernelSpec(value.kernelspec, incrementOptions('kernelspec', opts));
  }
  if (defined(value.jupytext)) {
    output.jupytext = validateJupytext(value.jupytext, incrementOptions('jupytext', opts));
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
  if (value.thumbnail === null) {
    // It is possible for the thumbnail to explicitly be null.
    // This means not to look to the images in a page.
    output.thumbnail = null;
  } else if (defined(value.thumbnail)) {
    output.thumbnail = validateString(value.thumbnail, incrementOptions('thumbnail', opts));
  }
  return output;
}

/**
 * Validate SiteFrontmatter object against the schema
 */
export function validateSiteFrontmatter(input: any, opts: Options) {
  const value = validateObjectKeys(input, { optional: SITE_FRONTMATTER_KEYS }, opts) || {};
  return validateSiteFrontmatterKeys(value, opts) as SiteFrontmatter;
}

/**
 * Validate ProjectFrontmatter object against the schema
 */
export function validateProjectFrontmatter(input: any, opts: Options) {
  const value = validateObjectKeys(input, { optional: PROJECT_FRONTMATTER_KEYS }, opts) || {};
  return validateProjectFrontmatterKeys(value, opts);
}

/**
 * Validate single PageFrontmatter object against the schema
 */
export function validatePageFrontmatter(input: any, opts: Options) {
  const value = validateObjectKeys(input, { optional: PAGE_FRONTMATTER_KEYS }, opts) || {};
  return validatePageFrontmatterKeys(value, opts);
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
  siteFrontmatter?: SiteFrontmatter,
) {
  if (siteFrontmatter) {
    projectFrontmatter = fillMissingKeys(projectFrontmatter, siteFrontmatter, USE_SITE_FALLBACK);
  }
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
