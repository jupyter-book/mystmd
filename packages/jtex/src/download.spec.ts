import fs from 'fs';
import { vol } from 'memfs';
import { resolveInputs } from './download';
import { Session } from './session';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('fs', () => require('memfs').fs);

describe('resolveInputs', () => {
  beforeEach(() => vol.reset());
  it('default path and url fill correctly', async () => {
    expect(resolveInputs(new Session(), {})).toEqual({
      templatePath: '_build/templates/public/default',
      templateUrl: 'https://api.curvenote.com/templates/tex/public/default/download',
    });
  });
  it('template as path to template file exists', async () => {
    vol.fromJSON({ 'templates/template.tex': '' });
    expect(resolveInputs(new Session(), { template: 'templates/template.tex' })).toEqual({
      templatePath: 'templates',
      templateUrl: undefined,
    });
  });
  it('template as path to template folder exists', async () => {
    vol.fromJSON({ 'templates/template.tex': '' });
    expect(resolveInputs(new Session(), { template: 'templates' })).toEqual({
      templatePath: 'templates',
      templateUrl: undefined,
    });
  });
  it('path to template folder exists', async () => {
    vol.fromJSON({ 'templates/template.tex': '' });
    expect(resolveInputs(new Session(), { path: 'templates' })).toEqual({
      templatePath: 'templates',
      templateUrl: undefined,
    });
  });
  it('path exists without template', async () => {
    vol.fromJSON({ 'templates/other.tex': '' });
    console.log(fs.existsSync('templates'));
    expect(resolveInputs(new Session(), { path: 'templates' })).toEqual({
      templatePath: 'templates',
      templateUrl: 'https://api.curvenote.com/templates/tex/public/default/download',
    });
  });
  it('template url is respected', async () => {
    vol.fromJSON({ 'templates/other.tex': '' });
    console.log(fs.existsSync('templates'));
    expect(resolveInputs(new Session(), { template: 'https://example.com' })).toEqual({
      templatePath:
        '_build/templates/100680ad546ce6a577f42f52df33b4cfdca756859e664b8d7de329b150d09ce9',
      templateUrl: 'https://example.com',
    });
  });
  it('non-default template is respected', async () => {
    expect(resolveInputs(new Session(), { template: 'private/journal' })).toEqual({
      templatePath: '_build/templates/private/journal',
      templateUrl: 'https://api.curvenote.com/templates/tex/private/journal/download',
    });
  });
  it('template name is prefixed with public', async () => {
    expect(resolveInputs(new Session(), { template: 'journal' })).toEqual({
      templatePath: '_build/templates/public/journal',
      templateUrl: 'https://api.curvenote.com/templates/tex/public/journal/download',
    });
  });
  it('invalid template errors', async () => {
    expect(() => resolveInputs(new Session(), { template: 'my/public/journal' })).toThrow();
  });
});
