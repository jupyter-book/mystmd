import type { ValidationOptions } from 'simple-validators';
import {
  validateSiteAction,
  validateSiteConfig,
  validateSiteNavItem,
  validateSiteProject,
} from './validators';

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
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
  it('full url returns self', async () => {
    expect(
      validateSiteNavItem({ title: 'my-folder', url: 'https://example.com/a/a' }, opts),
    ).toEqual({ title: 'my-folder', url: 'https://example.com/a/a' });
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
    expect(validateSiteAction({ title: 'example', url: '/a/b/c/d' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid path returns self', async () => {
    expect(validateSiteAction({ title: 'example', url: '/a/b' }, opts)).toEqual({
      title: 'example',
      url: '/a/b',
    });
  });
});

describe('validateSiteConfig', () => {
  it('valid site config returns self', async () => {
    const siteConfig = {
      projects: [{ path: 'my-proj', slug: 'test' }],
      nav: [{ title: 'cool folder', children: [{ title: 'cool page', url: '/test/cool-page' }] }],
      actions: [{ title: 'Go To Example', url: 'https://example.com', static: false }],
      domains: ['test.curve.space'],
      favicon: 'curvenote.png',
    };
    expect(validateSiteConfig(siteConfig, opts)).toEqual(siteConfig);
  });
  it('invalid list values are filtered', async () => {
    expect(
      validateSiteConfig(
        {
          projects: [{ path: 'my-proj', slug: '/my/proj' }],
          nav: [{ title: 'cool folder', children: 'a' }],
          actions: [{ title: 'Go To Example', url: 'bad_url', static: false }],
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
