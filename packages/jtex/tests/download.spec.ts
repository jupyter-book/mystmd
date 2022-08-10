import fs from 'fs';
import JTex, { downloadAndUnzipTemplate, Session } from '../src';

describe('Download Template', () => {
  it('Download default template', async () => {
    await downloadAndUnzipTemplate(new Session(), {
      template: 'default',
      path: '_build/templates',
    });
    expect(fs.existsSync('_build/templates/public/default/template.zip')).toBe(true);
    expect(fs.existsSync('_build/templates/public/default/template.yml')).toBe(true);
    expect(fs.existsSync('_build/templates/public/default/README.md')).toBe(true);
  });
  it('Bad template paths to throw', async () => {
    const jtex = new JTex(new Session(), '_build/templates/public/not-there');
    expect(() => jtex.render({} as any)).toThrow(/does not exist/);
  });
  it.only('Render out the template', async () => {
    const jtex = new JTex(new Session(), '_build/templates/public/default');
    jtex.render({
      contentPath: 'tests/test.tex',
      outputPath: '_build/tests/article.tex',
      data: {
        doc: {
          title: 'test',
          description: 'test',
          date: { day: '22', month: '7', year: '2022' },
          authors: [
            { name: 'Rowan Cockett', affiliation: 'Curvenote' },
            { name: 'Steve Purves', affiliation: 'Curvenote', orcid: '0000' },
          ],
        },
        options: {
          keywords: '',
        },
        tagged: {
          abstract: 'My abstract!',
        },
      },
    });
    expect(fs.existsSync('_build/tests/article.tex')).toBe(true);
    const content = fs.readFileSync('_build/tests/article.tex').toString();
    expect(content.includes('Volcanic Archipelago')).toBe(true);
    expect(content.includes('Rowan Cockett')).toBe(true);
    expect(content.includes('My abstract!')).toBe(true);
  });
});
