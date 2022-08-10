import fs from 'fs';
import { extname, basename, join, dirname } from 'path';
import nunjucks from 'nunjucks';
import type { ISession } from './types';
import { ensureDirectoryExists } from './utils';
import { curvenoteDef } from './definitions';

type Renderer = {
  CONTENT: string;
  doc: {
    title: string;
    description: string;
    date: {
      day: string;
      month: string;
      year: string;
    };
    authors: {
      name: string;
      affiliation: string;
      orcid?: string;
    }[];
  };
  options: {
    keywords: string;
  };
  tagged: {
    abstract: string;
  };
};

const DO_NOT_COPY = ['template.tex', 'thumbnail.png'];
const DO_NOT_COPY_EXTS = ['.md', '.yml', '.zip'];

class JTex {
  session: ISession;
  templatePath: string;
  env: nunjucks.Environment;

  constructor(session: ISession, templatePath: string) {
    this.session = session;
    this.templatePath = templatePath;
    this.env = nunjucks
      .configure(templatePath, {
        trimBlocks: true,
        tags: {
          blockStart: '[#',
          blockEnd: '#]',
          variableStart: '[-',
          variableEnd: '-]',
          commentStart: '%#',
          commentEnd: '#%',
        },
      })
      .addFilter('len', (array) => array.length);
  }

  render(opts: { contentPath: string; outputPath: string; data: Omit<Renderer, 'CONTENT'> }) {
    if (!fs.existsSync(join(this.templatePath, 'template.tex'))) {
      throw new Error(
        `The template at "${join(this.templatePath, 'template.tex')}" does not exist`,
      );
    }
    if (extname(opts.outputPath) !== '.tex') {
      throw new Error(`outputPath must be a ".tex" file, not "${opts.outputPath}"`);
    }
    this.session.log.debug(`Reading data from ${opts.contentPath}`);
    const content = fs.readFileSync(opts.contentPath).toString();
    const renderer: Renderer = {
      CONTENT: content,
      doc: opts.data.doc,
      tagged: opts.data.tagged,
      options: opts.data.options,
    };
    const rendered = this.env.render('template.tex', renderer);
    const outputDirectory = dirname(opts.outputPath);
    ensureDirectoryExists(outputDirectory);
    this.copyTemplateFiles(dirname(opts.outputPath));
    fs.writeFileSync(opts.outputPath, rendered);
    fs.writeFileSync(join(outputDirectory, 'curvenote.def'), curvenoteDef);
  }

  copyTemplateFiles(outputDir: string, opts?: { force?: boolean }) {
    const dir = fs
      .readdirSync(this.templatePath)
      .map((s) => join(this.templatePath, s))
      .filter((s) => {
        if (DO_NOT_COPY.includes(basename(s))) return false;
        if (DO_NOT_COPY_EXTS.includes(extname(s))) return false;
        if (fs.lstatSync(s).isDirectory()) return false;
        return true;
      });
    dir.forEach((file) => {
      const dest = join(outputDir, basename(file));
      if (fs.existsSync(dest)) {
        if (!opts?.force) {
          this.session.log.debug(`Template files ${file} already exists, not copying.`);
          return;
        }
        fs.rmSync(dest);
      }
      fs.copyFileSync(file, dest);
    });
  }

  freeform(template: string, data: Record<string, any>) {
    return this.env.renderString(template, data);
  }
}

export default JTex;
