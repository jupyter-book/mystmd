import { doi } from 'doi-utils';
import { credit } from 'credit-roles';
import { orcid } from 'orcid';
import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  fillMissingKeys,
  filterKeys,
  validateBoolean,
  validateDate,
  validateEmail,
  validateEnum,
  validateKeys,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationError,
  validationWarning,
} from 'simple-validators';
import { validateLicenses } from '../licenses/validators.js';
import { BinderProviders, ExportFormats } from './types.js';
import type {
  Author,
  Biblio,
  Export,
  Jupytext,
  KernelSpec,
  Numbering,
  PageFrontmatter,
  ProjectFrontmatter,
  SiteFrontmatter,
  TextRepresentation,
  Venue,
  Thebe,
  ThebeBinderOptions,
  ThebeServerOptions,
  ThebeLocalOptions,
} from './types.js';

export const SITE_FRONTMATTER_KEYS = [
  'title',
  'subtitle',
  'short_title',
  'description',
  'authors',
  'venue',
  'github',
  'keywords',
];
export const PROJECT_FRONTMATTER_KEYS = [
  'date',
  'name',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'binder',
  'source',
  'subject',
  'biblio',
  'oxa',
  'numbering',
  'bibliography',
  'math',
  'abbreviations',
  'exports',
  'thebe',
  'requirements',
  'resources',
].concat(SITE_FRONTMATTER_KEYS);
export const PAGE_FRONTMATTER_KEYS = [
  'kernelspec',
  'jupytext',
  'tags',
  'thumbnail',
  'thumbnailOptimized',
].concat(PROJECT_FRONTMATTER_KEYS);

// These keys only exist on the project.
PROJECT_FRONTMATTER_KEYS.push('references', 'requirements', 'resources');

export const USE_PROJECT_FALLBACK = [
  'authors',
  'date',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'github',
  'binder',
  'source',
  'subject',
  'venue',
  'biblio',
  'numbering',
  'keywords',
];

const AUTHOR_KEYS = [
  'userId',
  'name',
  'orcid',
  'corresponding',
  'email',
  'roles',
  'affiliations',
  'collaborations',
  'twitter',
  'github',
  'website',
];
const AUTHOR_ALIASES = {
  role: 'roles',
  affiliation: 'affiliations',
};
const BIBLIO_KEYS = ['volume', 'issue', 'first_page', 'last_page'];
const THEBE_KEYS = [
  'lite',
  'binder',
  'server',
  'kernelName',
  'sessionName',
  'disableSessionSaving',
  'mathjaxUrl',
  'mathjaxConfig',
  'local',
];
const THEBE_BINDER_OPTIONS_KEYS = ['url', 'ref', 'repo', 'provider'];
const THEBE_SERVER_OPTIONS_KEYS = ['url', 'token'];
const THEBE_LOCAL_OPTIONS_KEYS = ['url', 'token', 'kernelName', 'sessionName'];
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
export const RESERVED_EXPORT_KEYS = [
  'format',
  'template',
  'output',
  'id',
  'name',
  'renderer',
  'article',
  'sub_articles',
];

const KNOWN_ALIASES = {
  author: 'authors',
  affiliation: 'affiliations',
  export: 'exports',
};

const GITHUB_USERNAME_REPO_REGEX = '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$';

function validateBooleanOrObject<T extends Record<string, any>>(
  input: any,
  opts: ValidationOptions,
  objectValidator: (input: any, opts: ValidationOptions) => T | undefined,
): boolean | T | undefined {
  let output: boolean | T | undefined = validateBoolean(input, {
    ...opts,
    suppressWarnings: true,
    suppressErrors: true,
  });
  // TODO: could add an error here for validation of a non-bool non-object
  if (output === undefined) {
    output = objectValidator(input, opts);
  }
  return output;
}

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
export function validateAuthor(input: any, opts: ValidationOptions) {
  if (typeof input === 'string') {
    input = { name: input };
  }
  const value = validateObjectKeys(input, { optional: AUTHOR_KEYS, alias: AUTHOR_ALIASES }, opts);
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
    const orcidOpts = incrementOptions('orcid', opts);
    const id = orcid.normalize(value.orcid);
    if (id) {
      output.orcid = id;
    } else {
      validationError(
        `ORCID "${value.orcid}" is not valid, try an ID of the form "0000-0000-0000-0000"`,
        orcidOpts,
      );
    }
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
    let roles = value.roles;
    if (typeof roles === 'string') {
      roles = roles.split(/[,;]/);
    }
    output.roles = validateList(roles, rolesOpts, (r) => {
      const roleString = validateString(r, rolesOpts);
      if (roleString === undefined) return undefined;
      const role = credit.normalize(roleString);
      if (!role) {
        validationWarning(
          `unknown value "${roleString}" - should be a CRediT role - see https://credit.niso.org/`,
          rolesOpts,
        );
        return roleString.trim();
      }
      return role;
    });
  }
  if (defined(value.affiliations)) {
    const affiliationsOpts = incrementOptions('affiliations', opts);
    let affiliations = value.affiliations;
    if (typeof affiliations === 'string') {
      affiliations = affiliations.split(';');
    }
    output.affiliations = validateList(affiliations, affiliationsOpts, (aff) => {
      return validateString(aff, affiliationsOpts)?.trim();
    });
  }
  if (defined(value.collaborations)) {
    const collaborationsOpts = incrementOptions('collaborations', opts);
    let collaborations = value.collaborations;
    if (typeof collaborations === 'string') {
      collaborations = collaborations.split(';');
    }
    output.collaborations = validateList(collaborations, collaborationsOpts, (col) => {
      return validateString(col, collaborationsOpts)?.trim();
    });
  }
  if (defined(value.twitter)) {
    output.twitter = validateString(value.twitter, incrementOptions('twitter', opts));
  }
  if (defined(value.github)) {
    output.github = validateString(value.github, incrementOptions('github', opts));
  }
  if (defined(value.website)) {
    output.website = validateUrl(value.website, incrementOptions('website', opts));
  }
  return output;
}

function validateStringOrNumber(input: any, opts: ValidationOptions) {
  if (typeof input === 'string') return validateString(input, opts);
  if (typeof input === 'number') return input;
  return validationError('must be string or number', opts);
}

function validateBibliography(input: any, opts: ValidationOptions) {
  if (typeof input === 'string') {
    const value = validateString(input, opts);
    if (value) return [value];
    return undefined;
  }
  if (!Array.isArray(input)) {
    return validationError('must be string or a list of strings', opts);
  }
  return validateList(input, opts, (r) => {
    const role = validateString(r, opts);
    if (role === undefined) return undefined;
    return role;
  });
}

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

/**
 * Validate Thebe Object
 *
 * https://thebe-core.curve.space/docs-core/a-configuration
 */
export function validateThebe(input: any, opts: ValidationOptions) {
  const value: Thebe | undefined = validateObjectKeys(input, { optional: THEBE_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: Thebe = {};
  if (defined(value.lite)) {
    output.lite = validateBoolean(value.lite, incrementOptions('lite', opts));
  }
  if (defined(value.binder)) {
    output.binder = validateBooleanOrObject(
      value.binder,
      incrementOptions('binder', opts),
      validateThebeBinderOptions,
    );
  }
  if (defined(value.server)) {
    output.server = validateBooleanOrObject(
      value.server,
      incrementOptions('server', opts),
      validateThebeServerOptions,
    );
  }
  if (defined(value.kernelName)) {
    output.kernelName = validateString(value.kernelName, incrementOptions('kernelName', opts));
  }
  if (defined(value.sessionName)) {
    output.sessionName = validateString(value.sessionName, incrementOptions('sessionName', opts));
  }
  if (defined(value.disableSessionSaving)) {
    output.disableSessionSaving = validateBoolean(
      value.disableSessionSaving,
      incrementOptions('disableSessionSaving', opts),
    );
  }
  if (defined(value.mathjaxUrl)) {
    output.mathjaxUrl = validateUrl(value.mathjaxUrl, incrementOptions('mathjaxUrl', opts));
  }
  if (defined(value.mathjaxConfig)) {
    output.mathjaxConfig = validateString(
      value.mathjaxConfig,
      incrementOptions('mathjaxConfig', opts),
    );
  }
  if (defined(value.local)) {
    output.local = validateBooleanOrObject(
      value.local,
      incrementOptions('local', opts),
      validateThebeLocalOptions,
    );
  }
  return output;
}

export function validateThebeBinderOptions(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: THEBE_BINDER_OPTIONS_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: ThebeBinderOptions = {};
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.ref)) {
    output.ref = validateString(value.ref, incrementOptions('ref', opts));
  }
  if (defined(value.repo)) {
    output.repo = validateString(value.repo, {
      ...incrementOptions('repo', opts),
      regex: GITHUB_USERNAME_REPO_REGEX,
    });
  }
  if (defined(value.provider)) {
    output.provider = validateEnum<BinderProviders>(value.provider, {
      ...incrementOptions('provider', opts),
      enum: BinderProviders,
    });
  }
  return output;
}

export function validateThebeServerOptions(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: THEBE_SERVER_OPTIONS_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: ThebeServerOptions = {};
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.token)) {
    output.token = validateString(value.token, incrementOptions('token', opts));
  }
  return output;
}

export function validateThebeLocalOptions(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: THEBE_LOCAL_OPTIONS_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: ThebeLocalOptions = {};
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.token)) {
    output.token = validateString(value.token, incrementOptions('token', opts));
  }
  if (defined(value.kernelName)) {
    output.kernelName = validateString(value.kernelName, incrementOptions('kernelName', opts));
  }
  if (defined(value.sessionName)) {
    output.sessionName = validateString(value.sessionName, incrementOptions('sessionName', opts));
  }
  return output;
}

/**
 * Validate Numbering object
 */
export function validateNumbering(input: any, opts: ValidationOptions) {
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
export function validateKernelSpec(input: any, opts: ValidationOptions) {
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

function validateTextRepresentation(input: any, opts: ValidationOptions) {
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
    // The format version occasionally comes as a number in YAML, treat it as a string
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
export function validateJupytext(input: any, opts: ValidationOptions) {
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

export function validateExportsList(input: any, opts: ValidationOptions): Export[] | undefined {
  // Allow a single export to be defined as a dict
  if (input === undefined) return undefined;
  let exports: any[];
  if (Array.isArray(input)) {
    exports = input;
  } else {
    exports = [input];
  }
  const output = validateList(exports, incrementOptions('exports', opts), (exp, ind) => {
    return validateExport(exp, incrementOptions(`exports.${ind}`, opts));
  });
  if (!output || output.length === 0) return undefined;
  return output;
}

function validateExportFormat(input: any, opts: ValidationOptions): ExportFormats | undefined {
  if (input === undefined) return undefined;
  if (input === 'tex+pdf') input = 'pdf+tex';
  if (input === 'jats') input = 'xml';
  const format = validateEnum<ExportFormats>(input, { ...opts, enum: ExportFormats });
  return format;
}

export function validateExport(input: any, opts: ValidationOptions): Export | undefined {
  let value;
  if (typeof input === 'string') {
    const format = validateExportFormat(input, opts);
    if (!format) return undefined;
    value = { format };
  } else {
    value = validateObject(input, opts);
  }
  if (value === undefined) return undefined;
  validateKeys(
    value,
    { required: ['format'], optional: RESERVED_EXPORT_KEYS },
    { ...opts, suppressWarnings: true },
  );
  const format = validateExportFormat(value.format, incrementOptions('format', opts));
  if (format === undefined) return undefined;
  const output: Export = { ...value, format };
  if (value.template === null) {
    // It is possible for the template to explicitly be null.
    // This use no template (rather than default template).
    output.template = null;
  } else if (defined(value.template)) {
    output.template = validateString(value.template, incrementOptions('template', opts));
  }
  if (defined(value.output)) {
    output.output = validateString(value.output, incrementOptions('output', opts));
  }
  if (defined(value.article)) {
    output.article = validateString(value.article, incrementOptions('article', opts));
  }
  if (defined(value.sub_articles)) {
    if (output.format !== ExportFormats.xml && output.format !== ExportFormats.meca) {
      validationError(
        "sub_articles are only supported for exports of formats 'jats' or 'meca'",
        opts,
      );
    } else {
      output.sub_articles = validateList(
        value.sub_articles,
        incrementOptions('sub_articles', opts),
        (file, ind) => {
          return validateString(file, incrementOptions(`sub_articles.${ind}`, opts));
        },
      );
    }
  }
  return output;
}

export function validateGithubUrl(value: any, opts: ValidationOptions) {
  let github = value;
  if (typeof github === 'string') {
    const repo = github.match(GITHUB_USERNAME_REPO_REGEX);
    if (repo) {
      github = `https://github.com/${repo}`;
    }
  }
  return validateUrl(github, {
    ...incrementOptions('github', opts),
    includes: 'github',
  });
}

export function validateSiteFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: SiteFrontmatter = {};
  if (defined(value.title)) {
    output.title = validateString(value.title, incrementOptions('title', opts));
  }
  if (defined(value.description)) {
    output.description = validateString(value.description, incrementOptions('description', opts));
  }
  if (defined(value.short_title)) {
    output.short_title = validateString(value.short_title, {
      ...incrementOptions('short_title', opts),
      maxLength: 40,
    });
  }
  if (defined(value.subtitle)) {
    output.subtitle = validateString(value.subtitle, incrementOptions('subtitle', opts));
  }
  if (defined(value.authors)) {
    let authors = value.authors;
    // Turn a string into a list of strings, this will be transformed later
    if (!Array.isArray(value.authors)) {
      authors = [authors];
    }
    output.authors = validateList(authors, incrementOptions('authors', opts), (author, index) => {
      return validateAuthor(author, incrementOptions(`authors.${index}`, opts));
    });
    // Ensure there is a corresponding author if an email is provided
    const corresponding = output.authors?.find((a) => a.corresponding !== undefined);
    const email = output.authors?.find((a) => a.email);
    if (!corresponding && email) {
      email.corresponding = true;
    }
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
  return output;
}

export function validateProjectFrontmatterKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
) {
  const output: ProjectFrontmatter = validateSiteFrontmatterKeys(value, opts);
  if (defined(value.date)) {
    output.date = validateDate(value.date, incrementOptions('date', opts));
  }
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.doi)) {
    const doiOpts = incrementOptions('doi', opts);
    const doiString = validateString(value.doi, doiOpts);
    if (doiString !== undefined) {
      if (doi.validate(doiString, { strict: true })) {
        output.doi = doiString;
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
  if (defined(value.binder)) {
    output.binder = validateUrl(value.binder, incrementOptions('binder', opts));
  }
  if (defined(value.source)) {
    output.source = validateUrl(value.source, incrementOptions('source', opts));
  }
  if (defined(value.subject)) {
    output.subject = validateString(value.subject, {
      ...incrementOptions('subject', opts),
      maxLength: 40,
    });
  }
  if (defined(value.bibliography)) {
    output.bibliography = validateBibliography(
      value.bibliography,
      incrementOptions('bibliography', opts),
    );
  }
  if (defined(value.biblio)) {
    output.biblio = validateBiblio(value.biblio, incrementOptions('biblio', opts));
  }
  if (defined(value.oxa)) {
    // TODO: better oxa validation
    output.oxa = validateString(value.oxa, incrementOptions('oxa', opts));
  }
  if (defined(value.numbering)) {
    output.numbering = validateBooleanOrObject(
      value.numbering,
      incrementOptions('numbering', opts),
      validateNumbering,
    );
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
  if (defined(value.abbreviations)) {
    const abbreviationsOpts = incrementOptions('abbreviations', opts);
    const abbreviations = validateObject(value.abbreviations, abbreviationsOpts);
    if (abbreviations) {
      const stringKeys = Object.keys(abbreviations).filter((key) => {
        // Filter on non-string values
        return validateString(abbreviations[key], incrementOptions(key, abbreviationsOpts));
      });
      output.abbreviations = filterKeys(abbreviations, stringKeys);
    }
  }
  if (defined(value.exports)) {
    const exports = validateExportsList(value.exports, opts);
    if (exports) output.exports = exports;
  }
  // This is only for the project, and is not defined on pages
  if (defined(value.references)) {
    const referencesOpts = incrementOptions('references', opts);
    const references = validateObject(value.references, referencesOpts);
    if (references) {
      output.references = Object.fromEntries(
        Object.keys(references)
          .map((key) => {
            const url = validateUrl(references[key], incrementOptions(key, referencesOpts));
            if (!url) return undefined;
            return [key, { url }];
          })
          .filter((exists) => !!exists) as [string, { url: string }][],
      );
    }
  }

  if (defined(value.thebe)) {
    output.thebe = validateBooleanOrObject(
      value.thebe,
      incrementOptions('thebe', opts),
      validateThebe,
    );
  }

  console.log('REQUIREMENTS', value);
  if (defined(value.requirements)) {
    output.requirements = validateList(
      value.requirements,
      incrementOptions('requirements', opts),
      (req, index) => {
        return validateString(req, incrementOptions(`requirements.${index}`, opts));
      },
    );
  }
  if (defined(value.resources)) {
    output.resources = validateList(
      value.resources,
      incrementOptions('resources', opts),
      (res, index) => {
        return validateString(res, incrementOptions(`resources.${index}`, opts));
      },
    );
  }
  return output;
}

export function validatePageFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: PageFrontmatter = validateProjectFrontmatterKeys(value, opts);
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
  if (defined(value.thumbnailOptimized)) {
    // No validation, this is expected to be set programmatically
    output.thumbnailOptimized = value.thumbnailOptimized;
  }
  return output;
}

/**
 * Validate ProjectFrontmatter object against the schema
 */
export function validateProjectFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(input, { optional: PROJECT_FRONTMATTER_KEYS, alias: KNOWN_ALIASES }, opts) ||
    {};
  return validateProjectFrontmatterKeys(value, opts);
}

/**
 * Validate single PageFrontmatter object against the schema
 */
export function validatePageFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(input, { optional: PAGE_FRONTMATTER_KEYS, alias: KNOWN_ALIASES }, opts) ||
    {};
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
) {
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

  // Combine all abbreviation defined on page and project
  if (projectFrontmatter.abbreviations || pageFrontmatter.abbreviations) {
    frontmatter.abbreviations = {
      ...(projectFrontmatter.abbreviations ?? {}),
      ...(pageFrontmatter.abbreviations ?? {}),
    };
  }

  return frontmatter;
}

/**
 * Unnest `kernelspec` from `jupyter.kernelspec`
 */
export function unnestKernelSpec(pageFrontmatter: Record<string, any>) {
  if (pageFrontmatter.jupyter?.kernelspec) {
    // TODO: When we are exporting from local state, we will need to be more careful to
    // round-trip this correctly.
    pageFrontmatter.kernelspec = pageFrontmatter.jupyter.kernelspec;
    // This cleanup prevents warning on `jupyter.kernelspec` but keeps warnings if other
    // keys exist under `jupyter`
    delete pageFrontmatter.jupyter.kernelspec;
    if (!Object.keys(pageFrontmatter.jupyter).length) {
      delete pageFrontmatter.jupyter;
    }
  }
}
