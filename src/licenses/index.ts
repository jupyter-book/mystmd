import { Logger } from '../logging';
import LICENSES from '../static/licenses.json';
import { warnOnUnrecognizedKeys } from '../utils';
import { License } from './types';

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

export function validateLicense(
  log: Logger,
  license: string | { code: string; content: string },
): null | License | { code?: License; content?: License } {
  if (!license) return null;
  if (typeof license === 'string') {
    const key = license.toUpperCase();
    if (LICENSE_KEYS[key] === undefined) {
      log.error(
        `👩‍⚖️ The license "${license}" was not found, see https://spdx.org/licenses/ for valid SPDX keys.`,
      );
      return null;
    }
    const spdx = LICENSE_KEYS[key];
    const url = createURL(spdx);
    return {
      ...spdx,
      url,
    };
  }
  warnOnUnrecognizedKeys(
    log,
    license,
    'License must only have "code" and "content" or be a string.',
    new Set(['code', 'content']),
  );
  const code = (validateLicense(log, license.code) as License) ?? undefined;
  const content = (validateLicense(log, license.content) as License) ?? undefined;
  return { code, content };
}
