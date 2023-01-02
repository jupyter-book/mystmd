import type { ValidationOptions } from 'simple-validators';
import licenses from './licenses';
import fetch from 'node-fetch';
import { licensesToString, validateLicense, validateLicenses } from './validators';

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
    const data = await (await fetch('https://spdx.org/licenses/licenses.json')).json();
    const onlineLicenses = Object.fromEntries(
      (data.licenses as any[])
        .filter((l) => !l.isDeprecatedLicenseId)
        .sort((a, b) => a.licenseId.localeCompare(b.licenseId))
        .map((l) => [
          l.licenseId,
          {
            name: l.name,
            osi: l.isOsiApproved || undefined,
            free: l.isFsfLibre || undefined,
            CC: l.licenseId.startsWith('CC') || undefined,
          },
        ]),
    );
    expect(licenses).toEqual(onlineLicenses);
  });
});

describe('validateLicense', () => {
  it('invalid string errors', () => {
    expect(validateLicense('', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid string coerces', () => {
    expect(validateLicense('CC-BY-4.0', opts)).toEqual(TEST_LICENSE);
  });
  it('valid license object passes', () => {
    expect(validateLicense(TEST_LICENSE, opts)).toEqual(TEST_LICENSE);
  });
  it('invalid license object fails', () => {
    expect(validateLicense({ ...TEST_LICENSE, url: 'https://example.com' }, opts)).toEqual(
      undefined,
    );
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateLicenses', () => {
  it('invalid string errors', () => {
    expect(validateLicenses('', opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
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
  it('invalid content string errors', () => {
    expect(validateLicenses({ content: '' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('empty object returns self', () => {
    expect(validateLicenses({}, opts)).toEqual({});
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
});
