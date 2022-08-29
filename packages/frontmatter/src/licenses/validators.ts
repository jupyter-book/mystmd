import type { ValidationOptions } from '@curvenote/validators';
import {
  defined,
  incrementOptions,
  validateObjectKeys,
  validateString,
  validationError,
} from '@curvenote/validators';
import LICENSES from './licenses';
import type { License, Licenses } from './types';

const LICENSE_KEYS = Object.fromEntries(LICENSES.map((l) => [l.id.toUpperCase(), l]));

function createURL(license: Omit<License, 'url'>): string {
  if (license.CC) {
    const match = /^([CBYSAND0-]+)(?:(?:-)([0-9].[0-9]))?(?:(?:-)([A-Z]{2}))?$/.exec(license.id);
    if (!match) {
      throw new Error('Creative Commons license not found');
    }
    const kind = match[1].toUpperCase();
    const version = match[2] ?? '4.0';
    const extra = match[3] ?? '';
    let link = '';
    switch (kind) {
      case 'CC-BY':
        link = `/by/${version}/`;
        break;
      case 'CC-BY-SA':
        link = `/by-sa/${version}/`;
        break;
      case 'CC-BY-NC':
        link = `/by-nc/${version}/`;
        break;
      case 'CC-BY-NC-SA':
        link = `/by-nc-sa/${version}/`;
        break;
      case 'CC-BY-ND':
        link = `/by-nd/${version}/`;
        break;
      case 'CC-BY-NC-ND':
        link = `/by-nc-nd/${version}/`;
        break;
      case 'CC-ZERO':
      case 'CC-0':
      case 'CC0':
        link = '/zero/1.0/';
        break;
      case 'CC-PDDC':
        link = '/publicdomain/';
        break;
      default:
        break;
    }
    if (extra) link += `${extra}/`;
    return `https://creativecommons.org/licenses${link}`;
  }
  if (license.osi) {
    return `https://opensource.org/licenses/${license.id}`;
  }
  return `https://spdx.org/licenses/${license.id}`;
}

/**
 * Validate input to be known license id and return corresponding License object
 */
export function validateLicense(input: any, opts: ValidationOptions): License | undefined {
  if (typeof input === 'object') {
    const revalidated = validateLicense(input.id, {
      ...opts,
      suppressErrors: true,
      suppressWarnings: true,
    });
    let equal = Boolean(revalidated);
    if (revalidated) {
      Object.entries(revalidated).forEach(([key, val]) => {
        if (val !== input[key]) equal = false;
      });
    }
    if (!equal) {
      return validationError(
        `invalid license object - use a valid license ID string instead, see https://spdx.org/licenses/`,
        opts,
      );
    }
    return revalidated;
  }
  let value = validateString(input, opts);
  if (value === undefined) return undefined;
  value = value.toUpperCase();
  if (!LICENSE_KEYS[value]) {
    return validationError(
      `invalid value "${value}" - must be a valid license ID, see https://spdx.org/licenses/`,
      opts,
    );
  }
  const spdx = LICENSE_KEYS[value];
  const url = createURL(spdx);
  return { ...spdx, url };
}

/**
 * Validate Licenses object; coerces string ids into license objects
 *
 * Input value is either a single license id string or an object with
 * license ids for 'code' and/or 'content'
 */
export function validateLicenses(input: any, opts: ValidationOptions): Licenses | undefined {
  let contentOpts: ValidationOptions;
  if (typeof input === 'string') {
    input = { content: input };
    contentOpts = opts;
  } else {
    // This means 'licenses.content' only shows up in errors if present in original input
    contentOpts = incrementOptions('content', opts);
  }
  const value = validateObjectKeys(input, { optional: ['content', 'code'] }, opts);
  if (value === undefined) return undefined;
  const output: Licenses = {};
  if (defined(value.content)) {
    output.content = validateLicense(value.content, contentOpts);
  }
  if (defined(value.code) && value.code !== value.content) {
    output.code = validateLicense(value.code, incrementOptions('code', opts));
  }
  return output;
}

export function licensesToString(licenses: Licenses) {
  const stringLicenses: { content?: string; code?: string } = {};
  if (licenses.content) {
    if (!licenses.code || licenses.content.id === licenses.code.id) {
      return licenses.content.id;
    }
    stringLicenses.content = licenses.content.id;
  }
  if (licenses.code) {
    stringLicenses.code = licenses.code.id;
  }
  return stringLicenses;
}
