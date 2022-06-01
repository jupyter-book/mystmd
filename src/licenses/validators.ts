import LICENSES from '../static/licenses.json';
import {
  defined,
  incrementOptions,
  Options,
  validateObjectKeys,
  validateString,
  validationError,
} from '../utils/validators';
import { License, Licenses } from './types';

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
export function validateLicense(input: any, opts: Options): License | undefined {
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
export function validateLicenses(input: any, opts: Options): Licenses | undefined {
  let contentOpts: Options;
  let copyContentToCode = false;
  if (typeof input === 'string') {
    input = { content: input };
    copyContentToCode = true; // If we copy here then validate, we risk 2 duplicate validation errors
    contentOpts = opts;
  } else {
    // This means 'licenses.content' only shows up in errors if present in original input
    contentOpts = incrementOptions('content', opts);
  }
  const value = validateObjectKeys(input, { optional: ['content', 'code'] }, opts);
  if (value === undefined) return undefined;
  if (defined(value.content)) {
    value.content = validateLicense(value.content, contentOpts);
  }
  if (copyContentToCode) {
    value.code = value.content;
  } else if (defined(value.code)) {
    value.code = validateLicense(value.code, incrementOptions('code', opts));
  }
  return value;
}
