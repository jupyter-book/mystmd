import { basicLogger, LogLevel } from '../logging';
import {
  incrementOptions,
  locationSuffix,
  validateBoolean,
  validateDate,
  validateEmail,
  validateKeys,
  validateObject,
  validateString,
  validateUrl,
} from './validators';

const opts = { logger: basicLogger(LogLevel.info), property: 'test' };

describe('locationSuffix', () => {
  it('empty opts return empty string', async () => {
    expect(locationSuffix(opts)).toEqual('');
  });
  it('file opts return file', async () => {
    expect(locationSuffix({ ...opts, file: 'file.ts' })).toEqual(' (at file.ts)');
  });
  it('location opts return location', async () => {
    expect(locationSuffix({ ...opts, location: 'loc' })).toEqual(' (at loc)');
  });
  it('file/location opts return file/location', async () => {
    expect(locationSuffix({ ...opts, file: 'file.ts', location: 'loc' })).toEqual(
      ' (at file.ts#loc)',
    );
  });
});

describe('incrementOptions', () => {
  it('property sets location', async () => {
    expect(incrementOptions('new', opts)).toEqual({ ...opts, property: 'new', location: 'test' });
  });
  it('property updates location', async () => {
    expect(incrementOptions('new', { ...opts, location: 'object' })).toEqual({
      ...opts,
      property: 'new',
      location: 'object.test',
    });
  });
});

describe('validateBoolean', () => {
  it('true returns self', async () => {
    expect(validateBoolean(true, opts)).toEqual(true);
  });
  it('false returns self', async () => {
    expect(validateBoolean(false, opts)).toEqual(false);
  });
  it('"true" returns true', async () => {
    expect(validateBoolean('true', opts)).toEqual(true);
  });
  it('"False" returns false', async () => {
    expect(validateBoolean('False', opts)).toEqual(false);
  });
  it('invalid type errors', async () => {
    expect(() => validateBoolean(0, opts)).toThrow();
  });
  it('invalid string errors', async () => {
    expect(() => validateBoolean('t', opts)).toThrow();
  });
});

describe('validateString', () => {
  it('valid value returns self', async () => {
    expect(validateString('a', opts)).toEqual('a');
  });
  it('invalid type errors', async () => {
    expect(() => validateString({}, opts)).toThrow();
  });
  it('exceeding maxLenth errors', async () => {
    expect(() => validateString('abc', { maxLength: 1, ...opts })).toThrow();
  });
  it('regex match returns self', async () => {
    expect(validateString('abc', { regex: '^[a-c]{3}$', ...opts })).toEqual('abc');
  });
  it('incompatible regex errors', async () => {
    expect(() => validateString('abc', { regex: '^[a-c]{2}$', ...opts })).toThrow();
  });
});

describe('validateUrl', () => {
  it('valid value returns self', async () => {
    expect(validateUrl('https://example.com', opts)).toEqual('https://example.com');
  });
  it('valid value without scheme coerces', async () => {
    expect(validateUrl('example.com', opts)).toEqual('http://example.com');
  });
  it('invalid string errors', async () => {
    expect(() => validateUrl('not a url', opts)).toThrow();
  });
  it('valid value includes', async () => {
    expect(validateUrl('https://example.com', { ...opts, includes: 'le.c' })).toEqual(
      'https://example.com',
    );
  });
  it('valid value without scheme includes', async () => {
    expect(validateUrl('example.com', { ...opts, includes: 'le.c' })).toEqual('http://example.com');
  });
  it('valid value without includes errors', async () => {
    expect(() =>
      validateUrl('https://example.com', { ...opts, includes: 'example.org' }),
    ).toThrow();
  });
  it('valid value without includes errors', async () => {
    expect(() => validateUrl('example.com', { ...opts, includes: 'example.org' })).toThrow();
  });
});

describe('validateEmail', () => {
  it('valid email returns self', async () => {
    expect(validateEmail('example@example.com', opts)).toEqual('example@example.com');
  });
  it('invalid email errors', async () => {
    expect(() => validateEmail('https://example.com', opts)).toThrow();
  });
});

describe('validateDate', () => {
  it.each([
    '2021-12-14T10:43:51.777Z',
    '14 Dec 2021',
    '14 December 2021',
    '2021, December 14',
    '2021 December 14',
    '12/14/2021',
    '12-14-2021',
    '2022/12/14',
    '2022-12-14',
    new Date(),
  ])('valid date: %p', async (date: any) => {
    expect(validateDate(date, opts)).toEqual(date);
  });
  it('invalid date errors', async () => {
    expect(() => validateDate('https://example.com', opts)).toThrow();
  });
});

describe('validateObject', () => {
  it('valid value returns self', async () => {
    expect(validateObject({ a: 1 }, opts)).toEqual({ a: 1 });
  });
  it('invalid type errors', async () => {
    expect(() => validateObject('a', opts)).toThrow();
  });
});

describe('validateKeys', () => {
  it('empty value', async () => {
    expect(validateKeys({}, {}, opts)).toEqual({});
  });
  it('required keys', async () => {
    expect(validateKeys({ a: 1, b: 2 }, { required: ['a', 'b'] }, opts)).toEqual({ a: 1, b: 2 });
  });
  it('optional keys', async () => {
    expect(validateKeys({ a: 1, b: 2 }, { optional: ['a', 'b'] }, opts)).toEqual({ a: 1, b: 2 });
  });
  it('extra keys filtered', async () => {
    expect(validateKeys({ a: 1, b: 2, c: 3 }, { required: ['a'], optional: ['b'] }, opts)).toEqual({
      a: 1,
      b: 2,
    });
  });
  it('missing required keys errors', async () => {
    expect(() => validateKeys({ a: 1 }, { required: ['a', 'b'] }, opts)).toThrow();
  });
});
