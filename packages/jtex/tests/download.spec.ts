import fs from 'fs';
import { vol } from 'memfs';
import JTex, { downloadAndUnzipTemplate, resolveInputs, Session } from '../src';

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

describe('Download Template', () => {
  beforeAll(() => vol.reset());
  it('Download default template', async () => {
    const session = new Session();
    const inputs = resolveInputs(session, {});
    await downloadAndUnzipTemplate(session, {
      templatePath: inputs.templatePath,
      templateUrl: inputs.templateUrl || '',
    });
    expect(fs.existsSync('_build/templates/public/default/template.zip')).toBe(true);
    expect(fs.existsSync('_build/templates/public/default/template.yml')).toBe(true);
    expect(fs.existsSync('_build/templates/public/default/README.md')).toBe(true);
  });
  it('Bad template paths to throw', async () => {
    const jtex = new JTex(new Session(), { template: 'not-there' });
    expect(() => jtex.render({} as any)).toThrow(/does not exist/);
  });
  it('Render out the template', async () => {
    vol.fromJSON({
      'tests/test.tex':
        '\\section{Introduction}\n\nLa Palma is one of the west most islands in the Volcanic Archipelago of the Canary Islands.\n',
    });
    const jtex = new JTex(new Session(), { template: '_build/templates/public/default' });
    jtex.render({
      contentOrPath: 'tests/test.tex',
      outputPath: '_build/tests/article.tex',
      frontmatter: {
        title: 'test',
        description: 'test',
        date: new Date(2022, 6, 22).toISOString(),
        authors: [
          { name: 'Rowan Cockett', affiliations: ['Curvenote'] },
          { name: 'Steve Purves', affiliations: ['Curvenote'], orcid: '0000' },
        ],
      },
      options: {
        keywords: '',
      },
      tagged: {
        abstract: 'My abstract!',
      },
    });
    expect(fs.existsSync('_build/tests/article.tex')).toBe(true);
    const content = fs.readFileSync('_build/tests/article.tex').toString();
    expect(content.includes('Volcanic Archipelago')).toBe(true);
    expect(content.includes('Rowan Cockett')).toBe(true);
    expect(content.includes('My abstract!')).toBe(true);
  });
});
