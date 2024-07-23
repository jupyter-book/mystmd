import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  filterKeys,
  incrementOptions,
  validateBoolean,
  validateDate,
  validateList,
  validateObject,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationError,
} from 'simple-validators';
import { validateTOC } from 'myst-toc';
import { validateBiblio } from '../biblio/validators.js';
import { validateDownloadsList } from '../downloads/validators.js';
import { validateExportsList } from '../exports/validators.js';
import { validateLicenses } from '../licenses/validators.js';
import { validateNumbering } from '../numbering/validators.js';
import { validateExternalReferences } from '../references/validators.js';
import { validateSiteFrontmatterKeys } from '../site/validators.js';
import { validateThebe } from '../thebe/validators.js';
import { validateDoi } from '../utils/validators.js';
import { PAGE_KNOWN_PARTS, PROJECT_FRONTMATTER_KEYS } from './types.js';
import type { ProjectAndPageFrontmatter, ProjectFrontmatter } from './types.js';
import { validateProjectAndPageSettings } from '../settings/validators.js';
import { FRONTMATTER_ALIASES } from '../site/types.js';
import { validateMathMacroObject } from '../math/validators.js';

export function validateProjectAndPageFrontmatterKeys(
  value: Record<string, any>,
  opts: ValidationOptions,
) {
  const output: ProjectAndPageFrontmatter = validateSiteFrontmatterKeys(value, opts);
  if (defined(value.date)) {
    output.date = validateDate(value.date, incrementOptions('date', opts));
  }
  if (defined(value.doi)) {
    output.doi = validateDoi(value.doi, incrementOptions('doi', opts));
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
    output.bibliography = validateList(
      value.bibliography,
      { coerce: true, ...incrementOptions('bibliography', opts) },
      (req, index) => {
        return validateString(req, incrementOptions(`bibliography.${index}`, opts));
      },
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
    output.numbering = validateNumbering(value.numbering, incrementOptions('numbering', opts));
  }
  if (defined(value.math)) {
    output.math = validateMathMacroObject(value.math, incrementOptions('math', opts));
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
