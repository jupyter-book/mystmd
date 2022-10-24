import type { ValidationOptions } from 'simple-validators';
import {
  createCurvespaceUrl,
  getCurvespaceParts,
  isCurvespaceDomain,
  validateDomain,
} from './sites';

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('Curvespace Links', () => {
  test.each([
    ['', false, null, null],
    ['http://curve.space', false, null, null],
    ['curve.space', false, null, null],
    ['.curve.space', false, null, null],
    ['-.curve.space', false, null, null],
    ['https://my.curve.space', false, null, null], // Too short
    ['http://some.curve.space a', false, null, null], // partial string
    ['https://some.curve.space', true, 'some', null],
    ['some.curve.space', true, 'some', null],
    ['//some.curve.space', true, 'some', null],
    ['some-.curve.space', false, null, null],
    ['some&.curve.space', false, null, null],
    ['-some.curve.space', false, null, null],
    ['some-1.curve.space', true, 'some', '1'],
    ['some-one-x.curve.space', false, null, null],
    ['some-one.curve.space', true, 'some', 'one'],
    ['rowanc1-phd.curve.space', true, 'rowanc1', 'phd'],
    ['rowanc1-phD.curve.space', false, null, null], // No caps
    ['some-one_x.curve.space', true, 'some', 'one_x'],
    ['9some-one_x9.curve.space', true, '9some', 'one_x9'],
  ])('Test domain: %s', (link, isDomain, user, name) => {
    const testIsDomain = isCurvespaceDomain(link);
    expect(testIsDomain).toBe(isDomain);
    if (!isDomain) return;
    const [u, n] = getCurvespaceParts(link);
    expect(user).toBe(u);
    expect(name).toBe(n);
  });
  test('create URL', () => {
    expect(createCurvespaceUrl('some')).toBe('https://some.curve.space');
    expect(createCurvespaceUrl('some', 'one')).toBe('https://some-one.curve.space');
    expect(createCurvespaceUrl('some', 'CAPITAL')).toBe('https://some-capital.curve.space');
    expect(createCurvespaceUrl('SOME', 'CAPITAL')).toBe('https://some-capital.curve.space');
    expect(() => createCurvespaceUrl('some-')).toThrow();
    expect(() => createCurvespaceUrl('some-', 'one')).toThrow();
    expect(() => createCurvespaceUrl('some', 'one&')).toThrow();
    expect(() => createCurvespaceUrl('some', 'one-')).toThrow();
  });
});

describe('validateDomain', () => {
  it('sanity checking on domains', async () => {
    expect(validateDomain('www.example.com', opts)).toEqual('www.example.com');
    expect(validateDomain('vanilla.curve.space', opts)).toEqual('vanilla.curve.space');
    expect(validateDomain('vanilla-prj.curve.space', opts)).toEqual('vanilla-prj.curve.space');
    expect(validateDomain('vanilla-CAPITAL.curve.space', opts)).toBe('vanilla-capital.curve.space');
    expect(validateDomain('vanilla-prj--.curve.space', opts)).toBe(undefined);
    expect(validateDomain('', opts)).toEqual(undefined);
  });
});
