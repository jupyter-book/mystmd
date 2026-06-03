import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { resolveInputs, resolveSiteTemplateUrl } from './download';
import { DEFAULT_SITE_TEMPLATE_VERSION } from './defaultTemplates';
import { Session } from './session';
import { TemplateKind } from 'myst-common';

const RELEASES = 'https://github.com/jupyter-book/myst-theme/releases/download';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

describe('resolveInputs', () => {
  beforeEach(() => memfs.vol.reset());
  it('default path and url fill correctly', async () => {
    expect(resolveInputs(new Session(), { kind: TemplateKind.tex })).toEqual({
      templatePath: 'templates/tex/myst/plain_latex',
      templateUrl: 'https://api.mystmd.org/templates/tex/myst/plain_latex',
    });
  });
  it('template as path to template file exists', async () => {
    memfs.vol.fromJSON({ 'templates/template.tex': '' });
    expect(
      resolveInputs(new Session(), { kind: TemplateKind.tex, template: 'templates/template.tex' }),
    ).toEqual({
      templatePath: 'templates',
      templateUrl: undefined,
    });
  });
  it('template as path to template folder exists', async () => {
    memfs.vol.fromJSON({ 'templates/template.yml': '' });
    expect(resolveInputs(new Session(), { template: 'templates' })).toEqual({
      templatePath: 'templates',
      templateUrl: undefined,
    });
  });
  it('template url is respected', async () => {
    memfs.vol.fromJSON({ 'templates/other.tex': '' });
    expect(resolveInputs(new Session(), { template: 'https://example.com' })).toEqual({
      templatePath: 'templates/100680ad546ce6a577f42f52df33b4cfdca756859e664b8d7de329b150d09ce9',
      templateUrl: 'https://example.com',
    });
  });
  it('non-default template is respected', async () => {
    expect(
      resolveInputs(new Session(), {
        kind: TemplateKind.tex,
        template: 'private/journal',
        buildDir: '_build',
      }),
    ).toEqual({
      templatePath: '_build/templates/tex/private/journal',
      templateUrl: 'https://api.mystmd.org/templates/tex/private/journal',
    });
  });
  it('template name is prefixed with public', async () => {
    expect(resolveInputs(new Session(), { kind: TemplateKind.tex, template: 'journal' })).toEqual({
      templatePath: 'templates/tex/myst/journal',
      templateUrl: 'https://api.mystmd.org/templates/tex/myst/journal',
    });
  });
  it('invalid template errors', async () => {
    expect(() => resolveInputs(new Session(), { template: 'my/public/journal' })).toThrow();
  });
  it('site template resolves to a versioned release zip and hashed path', async () => {
    const { templateUrl, templatePath } = resolveInputs(new Session(), {
      kind: TemplateKind.site,
    });
    expect(templateUrl).toEqual(
      `${RELEASES}/myst-react@${DEFAULT_SITE_TEMPLATE_VERSION}/book-theme.zip`,
    );
    expect(templatePath).toMatch(/^templates\/site\/[a-f0-9]{64}$/);
  });
  it('pinned site template uses the requested version', async () => {
    expect(
      resolveInputs(new Session(), { kind: TemplateKind.site, template: 'book-theme@9.9.9' })
        .templateUrl,
    ).toEqual(`${RELEASES}/myst-react@9.9.9/book-theme.zip`);
  });
});

describe('resolveSiteTemplateUrl', () => {
  it('bare name uses the default org and baked version', () => {
    expect(resolveSiteTemplateUrl('book-theme')).toEqual(
      `${RELEASES}/myst-react@${DEFAULT_SITE_TEMPLATE_VERSION}/book-theme.zip`,
    );
  });
  it('undefined falls back to the default book-theme', () => {
    expect(resolveSiteTemplateUrl()).toEqual(
      `${RELEASES}/myst-react@${DEFAULT_SITE_TEMPLATE_VERSION}/book-theme.zip`,
    );
  });
  it('name@version pins the version', () => {
    expect(resolveSiteTemplateUrl('article-theme@1.3.1')).toEqual(
      `${RELEASES}/myst-react@1.3.1/article-theme.zip`,
    );
  });
  it('org/name@version overrides the org', () => {
    expect(resolveSiteTemplateUrl('myorga/book-theme@release-name')).toEqual(
      'https://github.com/myorga/myst-theme/releases/download/release-name/book-theme.zip',
    );
  });
  it('legacy site/myst/ namespace maps to the default org', () => {
    expect(resolveSiteTemplateUrl('site/myst/book-theme')).toEqual(
      `${RELEASES}/myst-react@${DEFAULT_SITE_TEMPLATE_VERSION}/book-theme.zip`,
    );
  });
  it('invalid name throws', () => {
    expect(() => resolveSiteTemplateUrl('a/b/c/d')).toThrow();
  });
});
