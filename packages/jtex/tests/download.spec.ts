import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { TemplateKind } from 'myst-common';
import MystTemplate, { downloadTemplate, resolveInputs, Session } from 'myst-templates';
import { renderTemplate } from '../src';

describe(
  'Download Template',
  () => {
    it('Download default template', async () => {
      const session = new Session();
      const inputs = resolveInputs(session, { buildDir: '_build', kind: TemplateKind.tex });
      await downloadTemplate(session, {
        templatePath: inputs.templatePath,
        templateUrl: inputs.templateUrl as string,
      });
      expect(fs.existsSync('_build/templates/tex/myst/plain_latex/template.zip')).toBe(true);
      expect(fs.existsSync('_build/templates/tex/myst/plain_latex/template.yml')).toBe(true);
      expect(fs.existsSync('_build/templates/tex/myst/plain_latex/template.tex')).toBe(true);
    });
    it('Bad template paths to throw', async () => {
      const jtex = new MystTemplate(new Session(), {
        template: 'not-there',
        kind: TemplateKind.tex,
      });
      expect(() => jtex.prepare({} as any)).toThrow(/does not exist/);
    });
    it('Render out the template', async () => {
      const jtex = new MystTemplate(new Session(), {
        kind: TemplateKind.tex,
        template: `${__dirname}/example`,
      });
      renderTemplate(jtex, {
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
  },
  { timeout: 15000 },
);
