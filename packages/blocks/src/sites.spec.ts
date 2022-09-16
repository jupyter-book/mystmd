import type { ValidationOptions } from 'simple-validators';
import {
  createCurvespaceUrl,
  getCurvespaceParts,
  isCurvespaceDomain,
  validateSiteAction,
  validateDomain,
  validateSiteAnalytics,
  validateSiteConfig,
  validateSiteDesign,
  validateSiteNavItem,
  validateVenue,
  validateSiteProject,
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

describe('validateVenue', () => {
  it('empty object returns self', async () => {
    expect(validateVenue({}, opts)).toEqual({});
  });
  it('object with title/url returns self', async () => {
    const venue = {
      title: 'test',
      url: 'http://example.com',
    };
    expect(validateVenue(venue, opts)).toEqual(venue);
  });
  it('invalid keys ignored', async () => {
    expect(validateVenue({ title: 'test', extra: '' }, opts)).toEqual({ title: 'test' });
  });
  it('string is invalid', async () => {
    expect(validateVenue('test', opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateSiteProject', () => {
  it('empty object errors', async () => {
    expect(validateSiteProject({}, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid site project returns self', async () => {
    const siteProj = {
      path: 'my-dir',
      slug: 'proj',
    };
    expect(validateSiteProject(siteProj, opts)).toEqual(siteProj);
  });
  it('invalid slug errors', async () => {
    expect(validateSiteProject({ path: 'my-dir', slug: '#' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateSiteNavItem', () => {
  it('empty object errors', async () => {
    expect(validateSiteNavItem({}, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid site nav folder returns self', async () => {
    const siteNavFolder = {
      title: 'my-folder',
      children: [],
    };
    expect(validateSiteNavItem(siteNavFolder, opts)).toEqual(siteNavFolder);
  });
  it('valid site nav page returns self', async () => {
    const siteNavPage = {
      title: 'my-folder',
      url: '/my-folder',
    };
    expect(validateSiteNavItem(siteNavPage, opts)).toEqual(siteNavPage);
  });
  it('invalid children errors', async () => {
    expect(validateSiteNavItem({ title: 'my-folder', children: 'a' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid child errors', async () => {
    expect(validateSiteNavItem({ title: 'my-folder', children: ['a'] }, opts)).toEqual({
      title: 'my-folder',
      children: [],
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid url errors', async () => {
    expect(validateSiteNavItem({ title: 'my-folder', url: '/a/a/a' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid full url errors', async () => {
    expect(
      validateSiteNavItem({ title: 'my-folder', url: 'https://example.com/a/a' }, opts),
    ).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateSiteAction', () => {
  it('empty object errors', async () => {
    expect(validateSiteAction({}, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid site project returns self', async () => {
    const siteAction = {
      title: 'example',
      url: 'https://example.com',
      static: false,
    };
    expect(validateSiteAction(siteAction, opts)).toEqual(siteAction);
  });
  it('invalid url errors', async () => {
    expect(validateSiteAction({ title: 'example', url: '/a' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validateSiteDesign', () => {
  it('empty object returns self', async () => {
    expect(validateSiteDesign({}, opts)).toEqual({});
  });
  it('valid site design returns self', async () => {
    const siteDesign = {
      hide_authors: true,
    };
    expect(validateSiteDesign(siteDesign, opts)).toEqual(siteDesign);
  });
});

describe('validateSiteAnalytics', () => {
  it('empty object returns self', async () => {
    expect(validateSiteAnalytics({}, opts)).toEqual({});
  });
  it('valid site design returns self', async () => {
    const siteAnalytics = {
      google: 'google',
      plausible: 'plausible',
    };
    expect(validateSiteAnalytics(siteAnalytics, opts)).toEqual(siteAnalytics);
  });
});

describe('validateSiteConfig', () => {
  it('valid site config returns self', async () => {
    const siteConfig = {
      projects: [{ path: 'my-proj', slug: 'test' }],
      nav: [{ title: 'cool folder', children: [{ title: 'cool page', url: '/test/cool-page' }] }],
      actions: [{ title: 'Go To Example', url: 'https://example.com', static: false }],
      domains: ['test.curve.space'],
      twitter: 'test',
      logo: 'curvenote.png',
      logo_text: 'test logo',
      favicon: 'curvenote.png',
      analytics: {
        google: 'google',
        plausible: 'plausible',
      },
      design: {
        hide_authors: true,
      },
    };
    expect(validateSiteConfig(siteConfig, opts)).toEqual(siteConfig);
  });
  it('invalid list values are filtered', async () => {
    expect(
      validateSiteConfig(
        {
          projects: [{ path: 'my-proj', slug: '/my/proj' }],
          nav: [{ title: 'cool folder', children: 'a' }],
          actions: [{ title: 'Go To Example', url: '/my/proj', static: false }],
          domains: ['example.com'],
        },
        opts,
      ),
    ).toEqual({
      projects: [],
      nav: [],
      actions: [],
      domains: [],
    });
    expect(opts.messages.errors?.length).toEqual(4);
  });
  it('invalid required values error', async () => {
    expect(
      validateSiteConfig(
        {
          projects: 'a',
          nav: [
            { title: 'cool folder', children: [{ title: 'cool page', url: '/test/cool-page' }] },
          ],
          actions: [{ title: 'Go To Example', url: 'https://example.com', static: false }],
          domains: 'test.curve.space',
        },
        opts,
      ),
    ).toEqual({
      nav: [{ title: 'cool folder', children: [{ title: 'cool page', url: '/test/cool-page' }] }],
      actions: [{ title: 'Go To Example', url: 'https://example.com', static: false }],
    });
    expect(opts.messages.errors?.length).toEqual(2);
  });
  it('empty config returns self', async () => {
    expect(validateSiteConfig({}, opts)).toEqual({});
  });
  it('domains are coerced, deduplicated', async () => {
    expect(
      validateSiteConfig(
        {
          domains: [
            'my.example.com',
            'http://another.example.com',
            'https://example.curve.space',
            'example.curve.space',
          ],
        },
        opts,
      ),
    ).toEqual({
      domains: ['my.example.com', 'another.example.com', 'example.curve.space'],
    });
    expect(opts.messages.errors).toEqual(undefined);
  });
});
