import { basicLogger, LogLevel } from '../logging';
import { Options } from '../utils/validators';
import {
  validateProjectConfig,
  validateSiteAction,
  validateSiteNavItem,
  validateSiteProject,
} from './validators';

let opts: Options;

beforeEach(() => {
  opts = { logger: basicLogger(LogLevel.info), property: 'test', count: {} };
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
  it('invalid remote url errors', async () => {
    expect(validateProjectConfig({ remote: 'https://example.com' }, opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
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
