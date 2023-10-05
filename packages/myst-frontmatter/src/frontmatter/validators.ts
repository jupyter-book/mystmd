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
  validateNumber,
} from 'simple-validators';
import { validateLicenses } from '../licenses/validators.js';
import { formatName, parseName } from '../utils/parseName.js';
import { ExportFormats } from './types.js';
import type {
  Contributor,
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
  BinderHubOptions,
  JupyterServerOptions,
  JupyterLocalOptions,
  ReferenceStash,
  Affiliation,
  Name,
} from './types.js';
import { validateFunding } from '../funding/validators.js';

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
  // Do not add any project specific keys here!
].concat(SITE_FRONTMATTER_KEYS);

export const PAGE_FRONTMATTER_KEYS = ['kernelspec', 'jupytext', 'tags'].concat(
  PROJECT_FRONTMATTER_KEYS,
);

// These keys only exist on the project.
PROJECT_FRONTMATTER_KEYS.push('references', 'requirements', 'resources', 'thebe');

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
  'funding',
  'authors',
  'affiliations',
];

const AFFILIATION_KEYS = [
  'id',
  'address',
  'city',
  'state',
  'postal_code',
  'country',
  'name',
  'department',
  'collaboration',
  'isni',
  'ringgold',
  'ror',
  'url',
  'email',
  'phone',
  'fax',
];

const CONTRIBUTOR_KEYS = [
  'id',
  'userId',
  'name',
  'nameParsed',
  'orcid',
  'corresponding',
  'equal_contributor',
  'deceased',
  'email',
  'roles',
  'affiliations',
  'collaborations',
  'twitter',
  'github',
  'url',
  'note',
  'phone',
  'fax',
];
const CONTRIBUTOR_ALIASES = {
  role: 'roles',
  'equal-contributor': 'equal_contributor',
  affiliation: 'affiliations',
  website: 'url',
};

const NAME_KEYS = [
  'literal',
  'given',
  'family',
  'suffix',
  'non_dropping_particle',
  'dropping_particle',
];
const NAME_ALIASES = {
  surname: 'family',
  last: 'family',
  forename: 'given',
  first: 'given',
  particle: 'non_dropping_particle',
  'non-dropping-particle': 'non_dropping_particle',
  'dropping-particle': 'dropping_particle',
};

const AFFILIATION_ALIASES = {
  ref: 'id', // Used in QMD to reference an affiliation
  region: 'state',
  province: 'state',
  website: 'url',
  institution: 'name',
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
const BINDER_HUB_OPTIONS_KEYS = ['url', 'ref', 'repo', 'provider'];
const JUPYTER_SERVER_OPTIONS_KEYS = ['url', 'token'];
const JUPYTER_LOCAL_OPTIONS_KEYS = ['url', 'token', 'kernelName', 'sessionName'];
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

const KNOWN_PAGE_ALIASES = {
  author: 'authors',
  contributor: 'contributors',
  affiliation: 'affiliations',
  export: 'exports',
};
const KNOWN_PROJECT_ALIASES = {
  ...KNOWN_PAGE_ALIASES,
  // This must also be updated in myst-config
  jupyter: 'thebe',
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

function stashPlaceholder(value: string) {
  return { id: value, name: value };
}

/**
 * Return true if object:
 *   - has 2 keys and only 2 keys: id and name
 *   - the values for id and name are the same
 */
function isStashPlaceholder(object: { id?: string; name?: string }) {
  return Object.keys(object).length === 2 && object.name && object.id && object.name === object.id;
}

function normalizedString(value: Record<string, any>) {
  return JSON.stringify(
    Object.entries(value)
      .filter(([, val]) => val !== undefined)
      .sort(),
  );
}

function pseudoUniqueId(kind: string, index: number, file?: string) {
  let suffix = '';
  if (file) {
    const fileParts = file.replace('\\', '/').split('/');
    const nameParts = fileParts[fileParts.length - 1].split('.');
    if (nameParts.length === 1) {
      suffix = `-${nameParts[0]}`;
    } else {
      suffix = `-${nameParts.slice(0, nameParts.length - 1).join('-')}`;
    }
  }
  return `${kind}${suffix}-generated-uid-${index}`;
}

/**
 * Update stash of authors/affiliations based on input value
 *
 * Input may be:
 *   - string name
 *   - string id
 *   - object without id
 *   - object with id
 *
 * This function will normalize all of the above to an id and if a corresponding
 * object does not yet exist in the stash, it will be added. The id is returned.
 *
 * This function will warn if two objects are explicitly defined with the same id.
 */
export function validateAndStashObject<T extends { id?: string; name?: string }>(
  input: any,
  stash: ReferenceStash,
  kind: 'affiliations' | 'contributors',
  validateFn: (v: any, o: ValidationOptions) => T | undefined,
  opts: ValidationOptions,
) {
  const lookup: Record<string, T & { id: string }> = {};
  const lookupNorm2Id: Record<string, string> = {};
  stash[kind]?.forEach((item) => {
    if (item.id) {
      lookup[item.id] = item as T & { id: string };
      lookupNorm2Id[normalizedString({ ...item, id: undefined })] = item.id;
    }
  });
  if (typeof input === 'string' && Object.keys(lookup).includes(input)) {
    // Handle case where input is id and object already exists
    return input;
  }
  const value = validateFn(input, opts);
  if (!value) return;
  // Only warn on duplicate if the new object is not a placeholder
  let warnOnDuplicate = !isStashPlaceholder(value);
  if (!value.id) {
    if (lookupNorm2Id[normalizedString(value)]) {
      // If object is defined without an id but already exists in the stash, use the existing id
      value.id = lookupNorm2Id[normalizedString(value)];
      // Do not warn on duplicates for these; any duplicates here are identical
      warnOnDuplicate = false;
    } else {
      // If object is defined without an id and does not exist in the stash, generate a new id
      value.id = pseudoUniqueId(kind, stash[kind]?.length ?? 0, opts.file);
    }
  }
  if (!Object.keys(lookup).includes(value.id)) {
    // Handle case of new id - add stash value
    lookup[value.id] = value as T & { id: string };
  } else if (isStashPlaceholder(lookup[value.id])) {
    // Handle case of existing placeholder { id: value, name: value } - replace stash value
    lookup[value.id] = value as T & { id: string };
  } else if (warnOnDuplicate) {
    // Warn on duplicate id - lose new object
    validationWarning(`duplicate id for ${kind} found in frontmatter: ${value.id}`, opts);
  }
  stash[kind] = Object.values(lookup);
  return value.id;
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
 * Validate Affiliation object against the schema
 */
export function validateAffiliation(input: any, opts: ValidationOptions) {
  if (typeof input === 'string') {
    input = stashPlaceholder(input);
  }
  const value = validateObjectKeys(
    input,
    { optional: AFFILIATION_KEYS, alias: AFFILIATION_ALIASES },
    opts,
  );
  if (value === undefined) return undefined;
  const output: Affiliation = {};
  if (defined(value.id)) {
    output.id = validateString(value.id, incrementOptions('id', opts));
  }
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  }
  if (defined(value.department)) {
    output.department = validateString(value.department, incrementOptions('department', opts));
  }
  if (defined(value.address)) {
    output.address = validateString(value.address, incrementOptions('address', opts));
  }
  if (defined(value.city)) {
    output.city = validateString(value.city, incrementOptions('city', opts));
  }
  if (defined(value.state)) {
    output.state = validateString(value.state, incrementOptions('state', opts));
  }
  if (defined(value.postal_code)) {
    output.postal_code = validateString(value.postal_code, incrementOptions('postal_code', opts));
  }
  if (defined(value.country)) {
    output.country = validateString(value.country, incrementOptions('country', opts));
  }
  // Both ISNI and ROR validation should occur similar to orcid (maybe in that same lib?)
  if (defined(value.isni)) {
    output.isni = validateString(value.isni, incrementOptions('isni', opts));
  }
  if (defined(value.ror)) {
    output.ror = validateString(value.ror, incrementOptions('ror', opts));
  }
  if (defined(value.ringgold)) {
    output.ringgold = validateNumber(value.ringgold, {
      min: 1000,
      max: 999999,
      ...incrementOptions('ringgold', opts),
    });
  }
  if (defined(value.collaboration)) {
    output.collaboration = validateBoolean(
      value.collaboration,
      incrementOptions('collaboration', opts),
    );
  }
  if (defined(value.email)) {
    output.email = validateEmail(value.email, incrementOptions('email', opts));
  }
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.phone)) {
    output.phone = validateString(value.phone, incrementOptions('phone', opts));
  }
  if (defined(value.fax)) {
    output.fax = validateString(value.fax, incrementOptions('fax', opts));
  }
  // If affiliation only has an id, give it a matching name; this is equivalent to the case
  // where a simple string is provided as an affiliation.
  if (Object.keys(output).length === 1 && output.id) {
    return stashPlaceholder(output.id);
  } else if (!output.name) {
    validationWarning('affiliation should include name/institution', opts);
  }
  return output;
}

/**
 * Validate Name object against the schema
 */
export function validateName(input: any, opts: ValidationOptions) {
  let output: Name;
  if (typeof input === 'string') {
    output = parseName(input);
  } else {
    const value = validateObjectKeys(input, { optional: NAME_KEYS, alias: NAME_ALIASES }, opts);
    if (value === undefined) return undefined;
    output = {};
    if (defined(value.literal)) {
      output.literal = validateString(value.literal, incrementOptions('literal', opts));
    }
    if (defined(value.given)) {
      output.given = validateString(value.given, incrementOptions('given', opts));
    }
    if (defined(value.non_dropping_particle)) {
      output.non_dropping_particle = validateString(
        value.non_dropping_particle,
        incrementOptions('non_dropping_particle', opts),
      );
    }
    if (defined(value.dropping_particle)) {
      output.dropping_particle = validateString(
        value.dropping_particle,
        incrementOptions('dropping_particle', opts),
      );
    }
    if (defined(value.family)) {
      output.family = validateString(value.family, incrementOptions('family', opts));
    }
    if (defined(value.suffix)) {
      output.suffix = validateString(value.suffix, incrementOptions('suffix', opts));
    }
    if (Object.keys(output).length === 1 && output.literal) {
      output = { ...output, ...parseName(output.literal) };
    } else if (!output.literal) {
      output.literal = formatName(output);
    }
  }
  const warnOnComma = (part: string | undefined, o: ValidationOptions) => {
    if (part && part.includes(',')) {
      validationWarning(`unexpected comma in name part: ${part}`, o);
    }
  };
  warnOnComma(output.given, incrementOptions('given', opts));
  warnOnComma(output.family, incrementOptions('family', opts));
  warnOnComma(output.non_dropping_particle, incrementOptions('non_dropping_particle', opts));
  warnOnComma(output.dropping_particle, incrementOptions('dropping_particle', opts));
  warnOnComma(output.suffix, incrementOptions('suffix', opts));
  if (!output.family) {
    validationWarning(`No family name for name '${output.literal}'`, opts);
  }
  if (!output.given) {
    validationWarning(`No given name for name '${output.literal}'`, opts);
  }
  return output;
}

/**
 * Validate Contributor object against the schema
 */
export function validateContributor(input: any, stash: ReferenceStash, opts: ValidationOptions) {
  if (typeof input === 'string') {
    input = { id: input, name: input };
  }
  const value = validateObjectKeys(
    input,
    { optional: CONTRIBUTOR_KEYS, alias: CONTRIBUTOR_ALIASES },
    opts,
  );
  if (value === undefined) return undefined;
  const output: Contributor = {};
  if (defined(value.id)) {
    output.id = validateString(value.id, incrementOptions('id', opts));
  }
  if (defined(value.userId)) {
    // TODO: Better userId validation - length? regex?
    output.userId = validateString(value.userId, incrementOptions('userId', opts));
  }
  if (defined(value.nameParsed)) {
    // In general, nameParsed should not be included in frontmatter;
    // authors should provide string or parsed for "name"
    output.nameParsed = validateName(value.nameParsed, incrementOptions('nameParsed', opts));
    output.name = value.name
      ? validateString(value.name, incrementOptions('name', opts))
      : output.nameParsed?.literal;
    if (output.name !== output.nameParsed?.literal) {
      validationWarning(`"name" and "parsedName.literal" should match`, opts);
    }
  } else if (defined(value.name)) {
    output.nameParsed = validateName(value.name, incrementOptions('name', opts));
    output.name = output.nameParsed?.literal;
  } else {
    validationWarning('contributor should include name', opts);
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
  if (defined(value.equal_contributor)) {
    output.equal_contributor = validateBoolean(
      value.equal_contributor,
      incrementOptions('equal_contributor', opts),
    );
  }
  if (defined(value.deceased)) {
    output.deceased = validateBoolean(value.deceased, incrementOptions('deceased', opts));
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
  if (defined(value.collaborations)) {
    validationError(
      'collaborations must be defined in frontmatter as affiliations with "collaboration: true"',
      incrementOptions('collaborations', opts),
    );
  }
  if (defined(value.affiliations)) {
    const affiliationsOpts = incrementOptions('affiliations', opts);
    let affiliations = value.affiliations;
    if (typeof affiliations === 'string') {
      affiliations = affiliations.split(';').map((aff) => aff.trim());
    }
    output.affiliations = validateList(affiliations, affiliationsOpts, (aff) => {
      return validateAndStashObject(
        aff,
        stash,
        'affiliations',
        validateAffiliation,
        affiliationsOpts,
      );
    });
  }
  if (defined(value.twitter)) {
    output.twitter = validateString(value.twitter, incrementOptions('twitter', opts));
  }
  if (defined(value.github)) {
    output.github = validateString(value.github, incrementOptions('github', opts));
  }
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.phone)) {
    output.phone = validateString(value.phone, incrementOptions('phone', opts));
  }
  if (defined(value.fax)) {
    output.fax = validateString(value.fax, incrementOptions('fax', opts));
  }
  if (defined(value.note)) {
    output.note = validateString(value.note, incrementOptions('note', opts));
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
 * Validate Thebe options
 *
 * https://thebe-core.curve.space/docs-core/a-configuration
 */
export function validateThebe(input: any, opts: ValidationOptions): Thebe | undefined {
  if (input === false) return undefined;
  if (input === true || input === 'server') return { server: true };
  if (input === 'lite') return { lite: true };
  if (input === 'binder') return { binder: true };

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
      validateBinderHubOptions,
    );
  }
  if (defined(value.server)) {
    output.server = validateBooleanOrObject(
      value.server,
      incrementOptions('server', opts),
      validateJupyterServerOptions,
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
      validateJupyterLocalOptions,
    );
  }
  return output;
}

export function validateBinderHubOptions(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: BINDER_HUB_OPTIONS_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: BinderHubOptions = {};
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.provider)) {
    output.provider = validateString(value.provider, {
      ...incrementOptions('provider', opts),
      regex: /.+/,
    });
  }
  if (defined(value.provider) && !output.provider?.match(/^(git|github|gitlab|gist)$/i)) {
    // repo can be any value, but must be present -> validate as any non empty string
    output.repo = validateString(value.repo, {
      ...incrementOptions('repo', opts),
      regex: /.+/,
    });
  } else {
    // otherwise repo is optional, but must be a valid GitHub username/repo is defined
    if (defined(value.repo)) {
      output.repo = validateString(value.repo, {
        ...incrementOptions('repo', opts),
        regex: GITHUB_USERNAME_REPO_REGEX,
      });
    }
  }
  if (defined(value.ref)) {
    output.ref = validateString(value.ref, incrementOptions('ref', opts));
  }

  return output;
}

export function validateJupyterServerOptions(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: JUPYTER_SERVER_OPTIONS_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: JupyterServerOptions = {};
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.token)) {
    output.token = validateString(value.token, incrementOptions('token', opts));
  }
  return output;
}

export function validateJupyterLocalOptions(input: any, opts: ValidationOptions) {
  const value = validateObjectKeys(input, { optional: JUPYTER_LOCAL_OPTIONS_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: JupyterLocalOptions = {};
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
    if (output.format !== ExportFormats.xml) {
      validationError("sub_articles are only supported for exports of format 'jats'", opts);
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
    let authors = value.authors;
    // Turn a string into a list of strings, this will be transformed later
    if (!Array.isArray(value.authors)) {
      authors = [authors];
    }
    stash.authorIds = validateList(authors, incrementOptions('authors', opts), (author, index) => {
      return validateAndStashObject(
        author,
        stash,
        'contributors',
        (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
        incrementOptions(`authors.${index}`, opts),
      );
    });
  }
  if (defined(value.contributors)) {
    // In addition to contributors defined here, additional contributors may be defined elsewhere
    // in the frontmatter (e.g. funding award investigator/recipient). These extra contributors
    // are combined with this list at the end of validation.
    let contributors = value.contributors;
    if (!Array.isArray(value.contributors)) {
      contributors = [contributors];
    }
    validateList(contributors, incrementOptions('contributors', opts), (contributor, index) => {
      return validateAndStashObject(
        contributor,
        stash,
        'contributors',
        (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
        incrementOptions(`contributors.${index}`, opts),
      );
    });
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
    output.funding = validateList(funding, incrementOptions('funding', opts), (fund, index) => {
      return validateFunding(fund, stash, incrementOptions(`funding.${index}`, opts));
    });
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

export function validateSharedProjectFrontmatterKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
) {
  const output: Omit<ProjectFrontmatter, 'thebe' | 'resources' | 'requirements' | 'references'> =
    validateSiteFrontmatterKeys(value, opts);
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
  return output;
}

export function validateProjectFrontmatterKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
) {
  const output: ProjectFrontmatter = validateSharedProjectFrontmatterKeys(value, opts);
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
    const result = validateThebe(value.thebe, incrementOptions('thebe', opts));
    if (result) output.thebe = result;
  }

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
  const output: PageFrontmatter = validateSharedProjectFrontmatterKeys(value, opts);
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
  return output;
}

/**
 * Validate ProjectFrontmatter object against the schema
 */
export function validateProjectFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(
      input,
      { optional: PROJECT_FRONTMATTER_KEYS, alias: KNOWN_PROJECT_ALIASES },
      opts,
    ) || {};
  return validateProjectFrontmatterKeys(value, opts);
}

/**
 * Validate single PageFrontmatter object against the schema
 */
export function validatePageFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(
      input,
      { optional: PAGE_FRONTMATTER_KEYS, alias: KNOWN_PAGE_ALIASES },
      opts,
    ) || {};
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
  opts: ValidationOptions,
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

  // Gather all contributors and affiliations from funding sources
  const contributorIds: Set<string> = new Set();
  const affiliationIds: Set<string> = new Set();
  frontmatter.funding?.forEach((fund) => {
    fund.awards?.forEach((award) => {
      award.investigators?.forEach((inv) => {
        contributorIds.add(inv);
      });
      award.recipients?.forEach((rec) => {
        contributorIds.add(rec);
      });
      award.sources?.forEach((aff) => {
        affiliationIds.add(aff);
      });
    });
  });

  if (frontmatter.authors?.length || contributorIds.size) {
    // Gather all people from page/project authors/contributors
    const people = [
      ...(pageFrontmatter.authors ?? []),
      ...(projectFrontmatter.authors ?? []),
      ...(pageFrontmatter.contributors ?? []),
      ...(projectFrontmatter.contributors ?? []),
    ];
    const peopleLookup: Record<string, Contributor> = {};
    people.forEach((auth) => {
      if (!auth.id || isStashPlaceholder(auth)) return;
      if (!peopleLookup[auth.id]) {
        peopleLookup[auth.id] = auth;
      } else if (normalizedString(auth) !== normalizedString(peopleLookup[auth.id])) {
        validationWarning(
          `Duplicate contributor id within project: ${auth.id}`,
          incrementOptions('authors', opts),
        );
      }
    });
    if (frontmatter.authors?.length) {
      frontmatter.authors = frontmatter.authors.map((auth) => {
        if (!auth.id) return auth;
        // If contributors are in final author list, do not add to contributor list
        contributorIds.delete(auth.id);
        return peopleLookup[auth.id] ?? stashPlaceholder(auth.id);
      });
    }
    if (contributorIds.size) {
      frontmatter.contributors = [...contributorIds].map((id) => {
        return peopleLookup[id] ?? stashPlaceholder(id);
      });
    }
  }

  // Add affiliations from reconstructed author/contributor lists and explicit page affiliations
  [...(frontmatter.authors ?? []), ...(frontmatter.contributors ?? [])].forEach((auth) => {
    auth.affiliations?.forEach((aff) => {
      affiliationIds.add(aff);
    });
  });
  frontmatter.affiliations?.forEach((aff) => {
    if (aff.id) affiliationIds.add(aff.id);
  });

  if (affiliationIds.size) {
    const affiliations = [
      ...(pageFrontmatter.affiliations ?? []),
      ...(projectFrontmatter.affiliations ?? []),
    ];
    const affiliationLookup: Record<string, Affiliation> = {};
    affiliations.forEach((aff) => {
      if (!aff.id || isStashPlaceholder(aff)) return;
      if (!affiliationLookup[aff.id]) {
        affiliationLookup[aff.id] = aff;
      } else if (normalizedString(aff) !== normalizedString(affiliationLookup[aff.id])) {
        validationWarning(
          `Duplicate affiliation id within project: ${aff.id}`,
          incrementOptions('affiliations', opts),
        );
      }
    });
    frontmatter.affiliations = [...affiliationIds].map((id) => {
      return affiliationLookup[id] ?? stashPlaceholder(id);
    });
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
