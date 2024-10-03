import type { ValidationOptions } from 'simple-validators';
import {
  validationWarning,
  defined,
  incrementOptions,
  validateObjectKeys,
  validateString,
  validateUrl,
  validateBoolean,
} from 'simple-validators';
import spdxCorrect from 'spdx-correct';
import LICENSES from './licenses.js';
import type { License, Licenses } from './types.js';

function correctLicense(license?: string): string | undefined {
  if (!license) return undefined;
  const value = spdxCorrect(license);
  if (value) return value;
  if (license.toUpperCase() === 'CC-BY') return 'CC-BY-4.0';
  return undefined;
}

function createURL(id: string, cc?: boolean, osi?: boolean): string {
  if (cc) {
    const match = /^([CBYSAND0ZEROPD-]+)(?:(?:-)([0-9].[0-9]))?(?:(?:-)([A-Z]{2,3}))?$/.exec(id);
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
  if (osi) {
    return `https://opensource.org/licenses/${id.replace(/(-or-later)|(-only)$/, '')}`;
  }
  return `https://spdx.org/licenses/${id}`;
}

function cleanUrl(url: string) {
  return url.replace(/^http:/, 'https:').replace(/\/$/, '');
}

function isUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol.includes('http');
  } catch (error) {
    return false;
  }
}

const ID_LICENSE_LOOKUP: Record<string, License> = Object.fromEntries(
  Object.entries(LICENSES).map(([key, value]) => {
    return [key, { id: key, ...value, url: createURL(key, value.CC, value.osi) }];
  }),
);

const URL_ID_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.values(ID_LICENSE_LOOKUP)
    .filter((value): value is License & { url: string; id: string } => !!value.url && !!value.id)
    .map((value) => {
      return [cleanUrl(value.url), value.id];
    }),
);

/**
 * Validate input to be known license id and return corresponding License object
 */
export function validateLicense(input: any, opts: ValidationOptions): License | undefined {
  if (typeof input === 'string') {
    const value = validateString(input, opts);
    if (value === undefined) return undefined;
    const valueSpdx = correctLicense(value);
    if (URL_ID_LOOKUP[cleanUrl(value)]) {
      input = { id: URL_ID_LOOKUP[cleanUrl(value)] };
    } else if (isUrl(value)) {
      input = { url: value };
    } else if (valueSpdx) {
      input = { id: value };
    } else if (value.match(/^[^\s]*$/)) {
      input = { id: value };
    } else if (value.length < 100) {
      input = { name: value };
    } else {
      input = { note: value };
    }
  }
  const value = validateObjectKeys(
    input,
    {
      optional: ['id', 'name', 'url', 'note', 'free', 'CC', 'osi'],
      alias: { cc: 'CC' },
    },
    opts,
  );
  if (!value) return undefined;
  const output: License = {};
  if (value.id != null) {
    const id = validateString(value.id, incrementOptions('id', opts));
    const idSpdx = correctLicense(id);
    if (!idSpdx) {
      validationWarning(
        `unknown license ID "${id}" - using a SPDX license ID is recommended, see https://spdx.org/licenses/`,
        opts,
      );
    } else if (idSpdx !== id) {
      validationWarning(
        `The SPDX ID for the license is "${idSpdx}". Corrected from "${id}".`,
        opts,
      );
    }
    output.id = idSpdx ?? id;
  } else {
    validationWarning(
      `no license ID - using a SPDX license ID is recommended, see https://spdx.org/licenses/`,
      opts,
    );
  }
  const expected = output.id ? ID_LICENSE_LOOKUP[output.id] : undefined;
  if (value.url != null) {
    const urlOpts = incrementOptions('url', opts);
    const url = validateUrl(value.url, urlOpts);
    if (url && expected?.url && cleanUrl(url) !== cleanUrl(expected.url)) {
      validationWarning(`incorrect URL for SPDX license ${expected.id} - "${url}"`, urlOpts);
    }
    output.url = url;
  } else if (expected?.url) {
    output.url = expected.url;
  }
  if (value.name != null) {
    const nameOpts = incrementOptions('name', opts);
    const name = validateString(value.name, nameOpts);
    if (name && expected?.name && name !== expected.name) {
      validationWarning(`incorrect name for SPDX license ${expected.id} - "${name}"`, nameOpts);
    }
    output.name = name;
  } else if (expected?.name) {
    output.name = expected.name;
  }
  if (value.note != null) {
    output.note = validateString(value.note, incrementOptions('note', opts));
  }
  if (value.free != null) {
    const freeOpts = incrementOptions('free', opts);
    const free = validateBoolean(value.free, freeOpts);
    if (free && !expected?.free) {
      validationWarning(
        'only SPDX licenses may specify they are "free" as listed by the FSF',
        freeOpts,
      );
    } else {
      output.free = free;
    }
  } else if (expected?.free != null) {
    output.free = expected.free;
  }
  if (value.CC != null) {
    const ccOpts = incrementOptions('CC', opts);
    const cc = validateBoolean(value.CC, ccOpts);
    if (
      cc &&
      !(expected?.CC || (output.url && new URL(output.url).host === 'creativecommons.org'))
    ) {
      validationWarning(
        'only licenses that link to creativecommons.org may specify that they are "CC"',
        ccOpts,
      );
    } else {
      output.CC = cc;
    }
  } else if (expected?.CC != null) {
    output.CC = expected.CC;
  }
  if (value.osi != null) {
    const osiOpts = incrementOptions('osi', opts);
    const osi = validateBoolean(value.osi, osiOpts);
    if (osi && !expected?.osi) {
      validationWarning('only SPDX licenses may specify they are "OSI approved"', osiOpts);
    } else {
      output.osi = osi;
    }
  } else if (expected?.osi != null) {
    output.osi = expected.osi;
  }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}

/**
 * Validate Licenses object; coerces string ids into license objects
 *
 * Input value is either a single license id string or an object with
 * license ids for 'code' and/or 'content'
 */
export function validateLicenses(input: any, opts: ValidationOptions): Licenses | undefined {
  let contentOpts: ValidationOptions;
  if (
    typeof input === 'string' ||
    (typeof input === 'object' && input.content == null && input.code == null)
  ) {
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
    const content = validateLicense(value.content, contentOpts);
    if (content) output.content = content;
  }
  if (defined(value.code) && value.code !== value.content) {
    const code = validateLicense(value.code, incrementOptions('code', opts));
    if (code) output.code = code;
  }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}

/**
 * Convert license object to either a single string or content/code strings
 *
 * This function only retains license ids, so it may lose other custom fields.
 */
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

function removeExpectedKeys(license: License, expected: License): License {
  const output: Record<string, any> = {};
  Object.entries(license).forEach(([key, val]) => {
    const licenseKey = key as keyof License;
    if (licenseKey === 'id' || val !== expected[licenseKey]) {
      output[licenseKey] = val;
    }
  });
  if (Object.keys(output).length === 1 && output.id) return output.id;
  return output as License;
}

function objectsEqual(a?: Record<string, any> | string, b?: Record<string, any> | string) {
  if (a == null || b == null) return false;
  const aAsString = typeof a === 'string' ? a : JSON.stringify(Object.entries(a).sort());
  const bAsString = typeof b === 'string' ? b : JSON.stringify(Object.entries(b).sort());
  return aAsString === bAsString;
}

/**
 * Simplify license object as much as possible without losing any custom fields
 */
export function simplifyLicenses(
  licenses: Licenses,
): string | { content?: string | License; code?: string | License } {
  const { content, code } = licenses;
  const simplified: { content?: string | License; code?: string | License } = {};
  if (content) {
    if (content.id) {
      simplified.content = removeExpectedKeys(content, ID_LICENSE_LOOKUP[content.id] ?? {});
    } else {
      simplified.content = { ...content };
    }
  }
  if (code) {
    if (code.id) {
      simplified.code = removeExpectedKeys(code, ID_LICENSE_LOOKUP[code.id] ?? {});
    } else {
      simplified.code = { ...code };
    }
  }
  if (objectsEqual(simplified.content, simplified.code)) {
    delete simplified.code;
  }
  if (!simplified.code && typeof simplified.content === 'string') {
    return simplified.content;
  }
  return simplified;
}
