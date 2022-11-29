import fs from 'fs';
import JTex, { downloadTemplate, resolveInputs, Session } from '../src';

describe('Download Template', () => {
  it('Download default template', async () => {
    const session = new Session();
    const inputs = resolveInputs(session, { buildDir: '_build' });
    await downloadTemplate(session, {
      templatePath: inputs.templatePath,
      templateUrl: inputs.templateUrl as string,
    });
    expect(fs.existsSync('_build/templates/tex/myst/curvenote/template.zip')).toBe(true);
    expect(fs.existsSync('_build/templates/tex/myst/curvenote/template.yml')).toBe(true);
    expect(fs.existsSync('_build/templates/tex/myst/curvenote/template.tex')).toBe(true);
  });
  it('Bad template paths to throw', async () => {
    const jtex = new JTex(new Session(), { template: 'not-there' });
    expect(() => jtex.preRender({} as any)).toThrow(/does not exist/);
  });
  it('Render out the template', async () => {
    const jtex = new JTex(new Session(), { template: `${__dirname}/example` });
    jtex.render({
      contentOrPath: `${__dirname}/test.tex`,
      outputPath: '_build/out/article.tex',
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
      parts: {
        abstract: 'My abstract!',
      },
    });
    expect(fs.existsSync('_build/out/article.tex')).toBe(true);
    const content = fs.readFileSync('_build/out/article.tex').toString();
    expect(content.includes('Volcanic Archipelago')).toBe(true);
    expect(content.includes('Rowan Cockett')).toBe(true);
    expect(content.includes('My abstract!')).toBe(true);
  });
});
