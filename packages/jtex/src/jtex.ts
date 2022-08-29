import fs from 'fs';
import { extname, basename, join, dirname } from 'path';
import yaml from 'js-yaml';
import nunjucks from 'nunjucks';
import type { PageFrontmatter } from '@curvenote/frontmatter';
import type { ValidationOptions } from '@curvenote/validators';
import { curvenoteDef } from './definitions';
import { resolveInputs, TEMPLATE_FILENAME } from './download';
import { extendJtexFrontmatter } from './frontmatter';
import type { ISession, Renderer } from './types';
import { ensureDirectoryExists } from './utils';
import { validateTemplateOptions, validateTemplateYml } from './validators';

const DO_NOT_COPY = [TEMPLATE_FILENAME, 'thumbnail.png'];
const DO_NOT_COPY_EXTS = ['.md', '.yml', '.zip'];

const TEMPLATE_YML = 'template.yml';

class JTex {
  session: ISession;
  templatePath: string;
  templateUrl: string | undefined;
  env: nunjucks.Environment;

  constructor(session: ISession, opts?: { template?: string; path?: string }) {
    this.session = session;
    const { templatePath, templateUrl } = resolveInputs(session, opts || {});
    this.templatePath = templatePath;
    this.templateUrl = templateUrl;
    this.env = nunjucks
      .configure(this.templatePath, {
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

  getTemplateYmlPath() {
    return join(this.templatePath, TEMPLATE_YML);
  }

  getTemplateYml() {
    const templateYmlPath = this.getTemplateYmlPath();
    if (!fs.existsSync(templateYmlPath)) {
      throw new Error(`The template yml at "${templateYmlPath}" does not exist`);
    }
    const content = fs.readFileSync(templateYmlPath).toString();
    return yaml.load(content);
  }

  getValidatedTemplateYml() {
    const opts: ValidationOptions = {
      file: this.getTemplateYmlPath(),
      property: 'template',
      messages: {},
    };
    const templateYml = validateTemplateYml(this.getTemplateYml(), opts);
    if (opts.messages.errors?.length) {
      opts.messages.errors.forEach((error) => {
        this.session.log.error(error.message);
      });
    }
    if (opts.messages.errors?.length || templateYml === undefined) {
      throw new Error(`Cannot use invalid ${TEMPLATE_YML}: ${this.getTemplateYmlPath()}`);
    }
    return templateYml;
  }

  validateOptions(templateOptions: any, file: string) {
    const templateYml = this.getValidatedTemplateYml();
    if (!templateYml?.config?.options) return {};
    const opts: ValidationOptions = {
      file,
      property: 'template_options',
      messages: {},
    };
    const validatedTemplateOptions = validateTemplateOptions(
      templateOptions,
      templateYml.config.options,
      opts,
    );
    if (opts.messages.errors?.length) {
      opts.messages.errors.forEach((error) => {
        this.session.log.error(error.message);
      });
    }
    if (opts.messages.errors?.length || validatedTemplateOptions === undefined) {
      throw new Error(`Unable to render with template ${this.getTemplateYmlPath()}`);
    }
    return validatedTemplateOptions;
  }

  render(opts: {
    contentOrPath: string;
    outputPath: string;
    frontmatter: PageFrontmatter;
    tagged: Record<string, string>;
    options: Record<string, any>;
  }) {
    if (!fs.existsSync(join(this.templatePath, TEMPLATE_FILENAME))) {
      throw new Error(
        `The template at "${join(this.templatePath, TEMPLATE_FILENAME)}" does not exist`,
      );
    }
    if (extname(opts.outputPath) !== '.tex') {
      throw new Error(`outputPath must be a ".tex" file, not "${opts.outputPath}"`);
    }
    let content: string;
    if (fs.existsSync(opts.contentOrPath)) {
      this.session.log.debug(`Reading content from ${opts.contentOrPath}`);
      content = fs.readFileSync(opts.contentOrPath).toString();
    } else {
      content = opts.contentOrPath;
    }
    const extendedFrontmatter = extendJtexFrontmatter(opts.frontmatter);
    const renderer: Renderer = {
      CONTENT: content,
      doc: extendedFrontmatter,
      tagged: opts.tagged,
      options: opts.options,
    };
    const rendered = this.env.render(TEMPLATE_FILENAME, renderer);
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
