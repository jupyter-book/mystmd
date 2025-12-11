import { describe, expect, beforeEach, it } from 'vitest';
import type { ValidationOptions } from 'simple-validators';
import licenses from './licenses';
import fetch from 'node-fetch';
import {
  licensesToString,
  simplifyLicenses,
  validateLicense,
  validateLicenses,
} from './validators';

const TEST_LICENSE = {
  name: 'Creative Commons Attribution 4.0 International',
  id: 'CC-BY-4.0',
  CC: true,
  free: true,
  url: 'https://creativecommons.org/licenses/by/4.0/',
};

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('licenses are upto date with SPDX', () => {
  it('compare with https://spdx.org/licenses/licenses.json', async () => {
    const data: any = await (await fetch('https://spdx.org/licenses/licenses.json')).json();
    const onlineLicenses = Object.fromEntries(
      (data.licenses as any[])
        .filter((l) => !l.isDeprecatedLicenseId)
        .sort((a, b) => a.licenseId.localeCompare(b.licenseId))
        .map((l) => [
          l.licenseId,
          (() => {
            const out: any = { name: l.name };
            if (l.isOsiApproved) out.osi = true;
            if (l.isFsfLibre) out.free = true;
            if (l.licenseId.startsWith('CC')) out.CC = true;
            return out;
          })(),
        ]),
    );
    expect(licenses).toEqual(onlineLicenses);
  });
});

describe('validateLicense', () => {
  it('non-spdx string warns', () => {
    expect(validateLicense('', opts)).toEqual({ id: '' });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('valid string coerces', () => {
    expect(validateLicense('CC-BY-4.0', opts)).toEqual(TEST_LICENSE);
  });
  it('valid license object passes', () => {
    expect(validateLicense(TEST_LICENSE, opts)).toEqual(TEST_LICENSE);
  });
  it('spdx license with incorrect url warns', () => {
    expect(validateLicense({ ...TEST_LICENSE, url: 'https://example.com' }, opts)).toEqual({
      ...TEST_LICENSE,
      url: 'https://example.com',
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
});

describe('validateLicenses', () => {
  it('non-spdx string warns', () => {
    expect(validateLicenses('', opts)).toEqual({ content: { id: '' } });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('corrects known licenses', () => {
    expect(validateLicenses('apache 2', opts)).toEqual({
      content: {
        id: 'Apache-2.0',
        name: 'Apache License 2.0',
        url: 'https://opensource.org/licenses/Apache-2.0',
        free: true,
        osi: true,
      },
    });
  });
  it('non-spdx content string warns', () => {
    expect(validateLicenses({ content: '' }, opts)).toEqual({ content: { id: '' } });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('empty object warns and returns undefined', () => {
    expect(validateLicenses({}, opts)).toEqual(undefined);
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('valid string coerces', () => {
    expect(validateLicenses('CC-BY-4.0', opts)).toEqual({
      content: TEST_LICENSE,
    });
  });
  it('valid code object coerces', () => {
    expect(validateLicenses({ code: 'CC-BY-4.0' }, opts)).toEqual({ code: TEST_LICENSE });
  });
  it('valid content object coerces', () => {
    expect(validateLicenses({ content: 'CC-BY-4.0' }, opts)).toEqual({ content: TEST_LICENSE });
  });
  it('valid matching content/code object coerces', () => {
    expect(validateLicenses({ content: 'CC-BY-4.0', code: 'CC-BY-4.0' }, opts)).toEqual({
      content: TEST_LICENSE,
    });
  });
  it('valid different content/code object coerces', () => {
    expect(validateLicenses({ content: 'CC-BY-4.0', code: 'CC-BY-3.0' }, opts)).toEqual({
      content: TEST_LICENSE,
      code: {
        name: 'Creative Commons Attribution 3.0 Unported',
        id: 'CC-BY-3.0',
        CC: true,
        url: 'https://creativecommons.org/licenses/by/3.0/',
      },
    });
  });
});

describe('licensesToString', () => {
  it('empty licenses returns self', () => {
    expect(licensesToString({})).toEqual({});
  });
  it('content licenses returns content string only', () => {
    expect(
      licensesToString({
        content: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual('CC-BY-SA-4.0');
  });
  it('code licenses returns code string', () => {
    expect(
      licensesToString({
        code: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual({ code: 'CC-BY-SA-4.0' });
  });
  it('matching content/code licenses returns string', () => {
    expect(
      licensesToString({
        content: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
        code: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual('CC-BY-SA-4.0');
  });
  it('content/code licenses returns content/code strings', () => {
    expect(
      licensesToString({
        content: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
        code: {
          name: 'Creative Commons Attribution No Derivatives 4.0 International',
          id: 'CC-BY-ND-4.0',
          CC: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual({ content: 'CC-BY-SA-4.0', code: 'CC-BY-ND-4.0' });
  });
  it('custom licenses lose info', () => {
    expect(
      licensesToString({
        content: {
          name: 'My Custom License',
          id: 'my-custom-license',
          url: 'https://example.com',
        },
        code: {
          name: 'Creative Commons Attribution No Derivatives 4.0 International',
          id: 'CC-BY-ND-4.0',
          CC: true,
          url: 'https://example.com',
          note: 'Using a CC license was probably a better idea...',
        },
      }),
    ).toEqual({ content: 'my-custom-license', code: 'CC-BY-ND-4.0' });
  });
  it('license without id is lost', () => {
    expect(
      licensesToString({
        content: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
        code: {
          name: 'Creative Commons Attribution No Derivatives 4.0 International',
          id: 'CC-BY-ND-4.0',
          CC: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual({ code: 'CC-BY-ND-4.0' });
  });
  it('licenses without ids are lost', () => {
    expect(
      licensesToString({
        content: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
        code: {
          name: 'Creative Commons Attribution No Derivatives 4.0 International',
          CC: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual(undefined);
  });
});

describe('simplifyLicenses', () => {
  it('empty licenses returns self', () => {
    expect(simplifyLicenses({})).toEqual({});
  });
  it('content licenses returns content string only', () => {
    expect(
      simplifyLicenses({
        content: TEST_LICENSE,
      }),
    ).toEqual(TEST_LICENSE.id);
  });
  it('code licenses returns code string', () => {
    expect(
      simplifyLicenses({
        code: TEST_LICENSE,
      }),
    ).toEqual({ code: TEST_LICENSE.id });
  });
  it('matching content/code licenses returns string', () => {
    expect(
      simplifyLicenses({
        content: TEST_LICENSE,
        code: TEST_LICENSE,
      }),
    ).toEqual(TEST_LICENSE.id);
  });
  it('content/code licenses returns content/code strings', () => {
    expect(
      simplifyLicenses({
        content: TEST_LICENSE,
        code: {
          name: 'Creative Commons Attribution No Derivatives 4.0 International',
          id: 'CC-BY-ND-4.0',
          CC: true,
          url: 'https://creativecommons.org/licenses/by-nd/4.0/',
        },
      }),
    ).toEqual({ content: TEST_LICENSE.id, code: 'CC-BY-ND-4.0' });
  });
  it('custom licenses do not lose info!', () => {
    expect(
      simplifyLicenses({
        content: {
          name: 'My Custom License',
          id: 'my-custom-license',
          url: 'https://example.com',
        },
        code: {
          ...TEST_LICENSE,
          url: 'https://example.com',
          note: 'Using a CC license was probably a better idea...',
        },
      }),
    ).toEqual({
      content: {
        name: 'My Custom License',
        id: 'my-custom-license',
        url: 'https://example.com',
      },
      code: {
        id: TEST_LICENSE.id,
        url: 'https://example.com',
        note: 'Using a CC license was probably a better idea...',
      },
    });
  });
  it('license without id persist!', () => {
    expect(
      simplifyLicenses({
        content: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
        code: {
          name: 'Creative Commons Attribution No Derivatives 4.0 International',
          id: 'CC-BY-ND-4.0',
          CC: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual({
      content: {
        name: 'Creative Commons Attribution Share Alike 4.0 International',
        CC: true,
        free: true,
        url: 'https://example.com',
      },
      code: {
        id: 'CC-BY-ND-4.0',
        url: 'https://example.com',
      },
    });
  });
  it('licenses without ids persist!', () => {
    expect(
      simplifyLicenses({
        content: {
          name: 'Creative Commons Attribution Share Alike 4.0 International',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
        code: {
          name: 'Creative Commons Attribution No Derivatives 4.0 International',
          CC: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual({
      content: {
        name: 'Creative Commons Attribution Share Alike 4.0 International',
        CC: true,
        free: true,
        url: 'https://example.com',
      },
      code: {
        name: 'Creative Commons Attribution No Derivatives 4.0 International',
        CC: true,
        url: 'https://example.com',
      },
    });
  });
});
