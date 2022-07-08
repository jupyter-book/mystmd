import { silentLogger } from '../logging';
import { Options } from '../utils/validators';
import {
  validateProjectConfig,
  validateSiteAction,
  validateSiteAnalytics,
  validateSiteConfig,
  validateSiteDesign,
  validateSiteNavItem,
  validateSiteProject,
} from './validators';

let opts: Options;

beforeEach(() => {
  opts = { logger: silentLogger(), property: 'test', count: {} };
});

describe('validateProjectConfig', () => {
  it('empty object returns self', async () => {
    expect(validateProjectConfig({}, opts)).toEqual({});
  });
  it('valid project config returns self', async () => {
    const projConfig = {
      remote: 'https://curvenote.com/@test/project',
      index: 'folder/readme.md',
      exclude: ['license.md'],
    };
    expect(validateProjectConfig(projConfig, opts)).toEqual(projConfig);
  });
  it('invalid exclude omitted', async () => {
    expect(validateProjectConfig({ exclude: ['license.md', 5] }, opts)).toEqual({
      exclude: ['license.md'],
    });
    expect(opts.count.errors).toEqual(1);
  });
});

describe('validateSiteProject', () => {
  it('empty object errors', async () => {
    expect(validateSiteProject({}, opts)).toEqual(undefined);
    expect(opts.count.errors).toEqual(1);
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
    expect(opts.count.errors).toEqual(1);
  });
});

describe('validateSiteNavItem', () => {
  it('empty object errors', async () => {
    expect(validateSiteNavItem({}, opts)).toEqual(undefined);
    expect(opts.count.errors).toEqual(1);
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
    expect(opts.count.errors).toEqual(1);
  });
  it('invalid child errors', async () => {
    expect(validateSiteNavItem({ title: 'my-folder', children: ['a'] }, opts)).toEqual({
      title: 'my-folder',
      children: [],
    });
    expect(opts.count.errors).toEqual(1);
  });
  it('invalid url errors', async () => {
    expect(validateSiteNavItem({ title: 'my-folder', url: '/a/a/a' }, opts)).toEqual(undefined);
    expect(opts.count.errors).toEqual(1);
  });
  it('invalid full url errors', async () => {
    expect(
      validateSiteNavItem({ title: 'my-folder', url: 'https://example.com/a/a' }, opts),
    ).toEqual(undefined);
    expect(opts.count.errors).toEqual(1);
  });
});

describe('validateSiteAction', () => {
  it('empty object errors', async () => {
    expect(validateSiteAction({}, opts)).toEqual(undefined);
    expect(opts.count.errors).toEqual(1);
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
    expect(opts.count.errors).toEqual(1);
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
      logoText: 'test logo',
      favicon: 'curvenote.png',
      buildPath: '_build',
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
    expect(opts.count.errors).toEqual(4);
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
          domains: ['test.curve.space'],
        },
        opts,
      ),
    ).toEqual(undefined);
    expect(opts.count.errors).toEqual(1);
  });
  it('missing required values are coerced', async () => {
    expect(validateSiteConfig({}, opts)).toEqual({
      projects: [],
      nav: [],
      actions: [],
      domains: [],
    });
    expect(opts.count.errors).toEqual(1);
  });
  it('valid required values are not coerced', async () => {
    expect(validateSiteConfig({ projects: [{ path: 'my-proj', slug: 'test' }] }, opts)).toEqual({
      projects: [{ path: 'my-proj', slug: 'test' }],
      nav: [],
      actions: [],
      domains: [],
    });
    expect(opts.count.errors).toEqual(1);
  });
});
