import { basicLogger, LogLevel } from '../logging';
import { validateLicense, validateLicenses } from './validators';

const opts = { logger: basicLogger(LogLevel.info), property: 'test' };

const TEST_LICENSE = {
  title: 'Creative Commons Attribution 4.0 International',
  id: 'CC-BY-4.0',
  CC: true,
  free: true,
  url: 'https://creativecommons.org/licenses/by/4.0/',
};

describe('validateLicense', () => {
  it('invalid string errors', async () => {
    expect(() => validateLicense('', opts)).toThrow();
  });
  it('valid string coerces', async () => {
    expect(validateLicense('CC-BY-4.0', opts)).toEqual(TEST_LICENSE);
  });
  it('valid license errors', async () => {
    expect(() => validateLicense(TEST_LICENSE, opts)).toThrow();
  });
});

describe('validateLicenses', () => {
  it('invalid string errors', async () => {
    expect(() => validateLicenses('', opts)).toThrow();
  });
  it('invalid content string errors', async () => {
    expect(() => validateLicenses({ content: '' }, opts)).toThrow();
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
