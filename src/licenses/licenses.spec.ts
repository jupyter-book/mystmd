import { basicLogger, LogLevel } from '../logging';
import { Options } from '../utils/validators';
import { licensesToString, validateLicense, validateLicenses } from './validators';

const TEST_LICENSE = {
  title: 'Creative Commons Attribution 4.0 International',
  id: 'CC-BY-4.0',
  CC: true,
  free: true,
  url: 'https://creativecommons.org/licenses/by/4.0/',
};

let opts: Options;

beforeEach(() => {
  opts = { logger: basicLogger(LogLevel.info), property: 'test', count: {} };
});

describe('validateLicense', () => {
  it('invalid string errors', async () => {
    expect(validateLicense('', opts)).toEqual(undefined);
    expect(opts.count.errors).toEqual(1);
  });
  it('valid string coerces', async () => {
    expect(validateLicense('CC-BY-4.0', opts)).toEqual(TEST_LICENSE);
  });
  it('valid license output errors', async () => {
    expect(validateLicense(TEST_LICENSE, opts)).toEqual(undefined);
    expect(opts.count.errors).toEqual(1);
  });
});

describe('validateLicenses', () => {
  it('invalid string errors', async () => {
    expect(validateLicenses('', opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('invalid content string errors', async () => {
    expect(validateLicenses({ content: '' }, opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('empty object returns self', async () => {
    expect(validateLicenses({}, opts)).toEqual({});
  });
  it('valid string coerces', async () => {
    expect(validateLicenses('CC-BY-4.0', opts)).toEqual({
      content: TEST_LICENSE,
      code: TEST_LICENSE,
    });
  });
  it('valid code object coerces', async () => {
    expect(validateLicenses({ code: 'CC-BY-4.0' }, opts)).toEqual({ code: TEST_LICENSE });
  });
  it('valid content object coerces', async () => {
    expect(validateLicenses({ content: 'CC-BY-4.0' }, opts)).toEqual({ content: TEST_LICENSE });
  });
});

describe('licensesToString', () => {
  it('empty licenses returns self', async () => {
    expect(licensesToString({})).toEqual({});
  });
  it('content licenses returns content string', async () => {
    expect(
      licensesToString({
        content: {
          title: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual({ content: 'CC-BY-SA-4.0' });
  });
  it('code licenses returns code string', async () => {
    expect(
      licensesToString({
        code: {
          title: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual({ code: 'CC-BY-SA-4.0' });
  });
  it('matching content/code licenses returns string', async () => {
    expect(
      licensesToString({
        content: {
          title: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
        code: {
          title: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual('CC-BY-SA-4.0');
  });
  it('content/code licenses returns content/code strings', async () => {
    expect(
      licensesToString({
        content: {
          title: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://example.com',
        },
        code: {
          title: 'Creative Commons Attribution No Derivatives 4.0 International',
          id: 'CC-BY-ND-4.0',
          CC: true,
          url: 'https://example.com',
        },
      }),
    ).toEqual({ content: 'CC-BY-SA-4.0', code: 'CC-BY-ND-4.0' });
  });
});
