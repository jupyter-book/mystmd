import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateDate,
  validateList,
  validateNumber,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationError,
  validationWarning,
} from 'simple-validators';
import { validateTOC } from 'myst-toc';
import { validatePublicationMeta } from '../biblio/validators.js';
import { validateDownloadsList } from '../downloads/validators.js';
import { validateExportsList } from '../exports/validators.js';
import { validateLicenses } from '../licenses/validators.js';
import { validateNumbering } from '../numbering/validators.js';
import { validateExternalReferences } from '../references/validators.js';
import { validateSiteFrontmatterKeys } from '../site/validators.js';
import { validateThebe } from '../thebe/validators.js';
import { validateDoi, validateStringOrNumber } from '../utils/validators.js';
import { KNOWN_EXTERNAL_IDENTIFIERS, PROJECT_FRONTMATTER_KEYS } from './types.js';
import type { ProjectAndPageFrontmatter, ProjectFrontmatter } from './types.js';
import { validateProjectAndPageSettings } from '../settings/validators.js';
import { FRONTMATTER_ALIASES } from '../site/types.js';
import { validateMathMacroObject } from '../math/validators.js';
import { validateSocialLinks } from '../socials/validators.js';

function getExternalIdentifierValidator(
  key: string,
): (value: any, opts: ValidationOptions) => string | number | undefined {
  if (key === 'arxiv') {
    return (value: any, opts: ValidationOptions) => {
      return validateUrl(value, {
        ...incrementOptions('arxiv', opts),
        includes: 'arxiv.org',
      });
    };
  }
  if (key === 'pmid') {
    return (value: any, opts: ValidationOptions) => {
      return validateNumber(value, {
        ...incrementOptions('pmid', opts),
        integer: true,
        min: 1,
      });
    };
  }
  if (key === 'pmcid') {
    return (value: any, opts: ValidationOptions) => {
      return validateString(value, {
        ...incrementOptions('pmcid', opts),
        regex: '^PMC[0-9]+$',
      });
    };
  }
  if (key === 'zenodo') {
    return (value: any, opts: ValidationOptions) => {
      return validateUrl(value, {
        ...incrementOptions('zenodo', opts),
        includes: 'zenodo.org',
      });
    };
  }
  return (value: any, opts: ValidationOptions) => {
    return validateStringOrNumber(value, incrementOptions(key, opts));
  };
}

export function validateProjectAndPageFrontmatterKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
) {
  const output: ProjectAndPageFrontmatter = validateSiteFrontmatterKeys(value, opts);
  if (defined(value.date)) {
    output.date = validateDate(value.date, incrementOptions('date', opts));
  }
  const identifiersOpts = incrementOptions('identifiers', opts);
  let identifiers: Record<string, string | number> | undefined;
  if (defined(value.identifiers)) {
    identifiers = validateObjectKeys(
      value.identifiers,
      { optional: KNOWN_EXTERNAL_IDENTIFIERS },
      { keepExtraKeys: true, suppressWarnings: true, ...identifiersOpts },
    );
  }
  KNOWN_EXTERNAL_IDENTIFIERS.forEach((identifierKey) => {
    if (defined(value[identifierKey])) {
      identifiers ??= {};
      if (identifiers[identifierKey]) {
        validationError(`duplicate value for identifier ${identifierKey}`, identifiersOpts);
      } else {
        identifiers[identifierKey] = value[identifierKey];
      }
    }
  });
  if (identifiers?.doi) {
    if (defined(value.doi)) {
      validationError(`duplicate value for DOI`, identifiersOpts);
    } else {
      value.doi = identifiers.doi;
      validationWarning(
        "DOI should be defined directly on the project frontmatter, not under 'identifiers'",
        identifiersOpts,
      );
    }
    delete identifiers.doi;
  }
  if (identifiers) {
    const identifiersEntries = Object.entries(identifiers)
      .map(([k, v]) => {
        const validator = getExternalIdentifierValidator(k);
        return [k, validator(v, identifiersOpts)];
      })
      .filter((entry): entry is [string, string | number] => entry[1] != null);
    if (identifiersEntries.length > 0) {
      output.identifiers = Object.fromEntries(identifiersEntries);
    }
  }
  if (defined(value.doi)) {
    output.doi = validateDoi(value.doi, incrementOptions('doi', opts));
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
    output.bibliography = validateList(
      value.bibliography,
      { coerce: true, ...incrementOptions('bibliography', opts) },
      (req, index) => {
        return validateString(req, incrementOptions(`bibliography.${index}`, opts));
      },
    );
  }
  if (defined(value.volume)) {
    output.volume = validatePublicationMeta(value.volume, incrementOptions('volume', opts));
  }
  if (defined(value.issue)) {
    output.issue = validatePublicationMeta(value.issue, incrementOptions('issue', opts));
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
  if (defined(value.oxa)) {
    // TODO: better oxa validation
    output.oxa = validateString(value.oxa, incrementOptions('oxa', opts));
  }
  if (defined(value.numbering)) {
    output.numbering = validateNumbering(value.numbering, incrementOptions('numbering', opts));
  }
  if (defined(value.math)) {
    output.math = validateMathMacroObject(value.math, incrementOptions('math', opts));
  }
  if (defined(value.abbreviations)) {
    const abbreviationsOpts = incrementOptions('abbreviations', opts);
    const abbreviations = Object.fromEntries(
      Object.entries(validateObject(value.abbreviations, abbreviationsOpts) ?? {})
        .map(([k, v]) => {
          // A null / false explicitly disables an abbreviation
          if (v === null || v === false) return [k, null];
          // Filter on non-string values
          const title = validateString(v, incrementOptions(k, abbreviationsOpts));
          // Ensure that we filter out invalid abbreviations (single characters)
          const key = validateString(k, {
            ...incrementOptions(k, abbreviationsOpts),
            minLength: 2,
          });
          if (!(key && title)) return null;
          return [k, title];
        })
        .filter((v): v is [string, string | null] => !!v),
    );
    if (abbreviations && Object.keys(abbreviations).length > 0) {
      output.abbreviations = abbreviations;
    }
  }
  if (defined(value.exports)) {
    const exports = validateExportsList(value.exports, opts);
    if (exports) output.exports = exports;
  }
  if (defined(value.downloads)) {
    const downloads = validateDownloadsList(value.downloads, opts);
    if (downloads) output.downloads = downloads;
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
  if (defined(value.settings)) {
    const settings = validateProjectAndPageSettings(
      value.settings,
      incrementOptions('settings', opts),
    );
    if (settings) output.settings = settings;
  }
  if (value.edit_url === null) {
    output.edit_url = null;
  } else if (defined(value.edit_url)) {
    output.edit_url = validateUrl(value.edit_url, incrementOptions('edit_url', opts));
  }
  return output;
}

export function validateProjectFrontmatterKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
) {
  const output: ProjectFrontmatter = validateProjectAndPageFrontmatterKeys(value, opts);
  // This is only for the project, and is not defined on pages
  if (defined(value.id)) {
    output.id = validateString(value.id, incrementOptions('id', opts));
  }
  if (defined(value.references)) {
    output.references = validateExternalReferences(
      value.references,
      incrementOptions('references', opts),
    );
  }

  if (defined(value.thebe)) {
    const result = validateThebe(value.thebe, output.github, incrementOptions('thebe', opts));
    if (result && Object.values(result).filter((val) => val !== undefined).length > 0) {
      output.thebe = result;
    } else {
      delete output.thebe;
    }
  }

  if (defined(value.toc)) {
    output.toc = validateTOC(value.toc, incrementOptions('toc', opts));
  }

  if (defined(value.social)) {
    output.social = validateSocialLinks(value.social, incrementOptions('social', opts));
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

/**
 * Validate ProjectFrontmatter object against the schema
 */
export function validateProjectFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(
      input,
      { optional: PROJECT_FRONTMATTER_KEYS, alias: { ...FRONTMATTER_ALIASES, name: 'label' } },
      opts,
    ) || {};
  return validateProjectFrontmatterKeys(value, opts);
}
