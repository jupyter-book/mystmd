import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { resolveInputs } from './download';
import { Session } from './session';
import { TemplateKind } from 'myst-common';

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
});
