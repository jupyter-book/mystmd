import fs from 'fs';
import { extname, basename, join, dirname } from 'path';
import yaml from 'js-yaml';
import type { TemplateYml } from 'myst-templates';
import nunjucks from 'nunjucks';
import type { ValidationOptions } from 'simple-validators';
import type { TemplateKinds } from './download';
import { downloadAndUnzipTemplate, resolveInputs, TEMPLATE_FILENAME } from './download';
import { pdfExportCommand } from './export';
import { extendJtexFrontmatter } from './frontmatter';
import { renderImports } from './imports';
import { getSession } from './session';
import type { TemplateImports, ISession, Renderer } from './types';
import { ensureDirectoryExists, errorLogger, warningLogger } from './utils';
import {
  validateTemplateDoc,
  validateTemplateOptions,
  validateTemplateParts,
  validateTemplateYml,
} from './validators';
import version from './version';

const DO_NOT_COPY = [TEMPLATE_FILENAME, 'thumbnail.png'];
const DO_NOT_COPY_EXTS = ['.md', '.yml', '.zip'];

const TEMPLATE_YML = 'template.yml';

class JTex {
  session: ISession;
  templatePath: string;
  templateUrl: string | undefined;
  env: nunjucks.Environment;
  validatedTemplateYml: TemplateYml | undefined;

  /**
   * JTex class for template validation and rendering
   *
   * Constructor takes a session object for logging and optional template/path.
   * Template may be a path to an existing template on disk, a URL where the zipped
   * template may be downloaded, or the name of a Curvenote template. Path is the
   * local path where the downloaded template will be saved.
   */
  constructor(
    session: ISession,
    opts?: { kind?: TemplateKinds; template?: string; buildDir?: string },
  ) {
    this.session = getSession(session.log);
    const { templatePath, templateUrl } = resolveInputs(this.session, opts || {});
    this.templatePath = templatePath;
    this.templateUrl = templateUrl;
    this.env = nunjucks
      .configure(this.templatePath, {
        trimBlocks: true,
        autoescape: false, // Ensures that we are not writing to HTML!
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
    if (this.validatedTemplateYml == null) {
      const opts: ValidationOptions = {
        file: this.getTemplateYmlPath(),
        property: 'template',
        messages: {},
        errorLogFn: errorLogger(this.session),
        warningLogFn: warningLogger(this.session),
      };
      const templateYml = validateTemplateYml(this.getTemplateYml(), {
        ...opts,
        templateDir: this.templatePath,
      });
      if (opts.messages.errors?.length || templateYml === undefined) {
        // Strictly error if template.yml is invalid
        throw new Error(`Cannot use invalid ${TEMPLATE_YML}: ${this.getTemplateYmlPath()}`);
      }
      this.validatedTemplateYml = templateYml;
    }
    return this.validatedTemplateYml;
  }

  validateOptions(options: any, file?: string) {
    const templateYml = this.getValidatedTemplateYml();
    const opts: ValidationOptions = {
      file,
      property: 'options',
      messages: {},
      errorLogFn: errorLogger(this.session),
      warningLogFn: warningLogger(this.session),
    };
    const validatedOptions = validateTemplateOptions(options, templateYml?.options || [], opts);
    if (validatedOptions === undefined) {
      // Pass even if there are some validation errors; only error on total failure
      throw new Error(
        `Unable to parse options for template ${this.getTemplateYmlPath()}${
          file ? ' from ' : ''
        }${file}`,
      );
    }
    return validatedOptions;
  }

  validateParts(parts: any, options: Record<string, any>, file?: string) {
    const templateYml = this.getValidatedTemplateYml();
    const opts: ValidationOptions = {
      file,
      property: 'parts',
      messages: {},
      errorLogFn: errorLogger(this.session),
      warningLogFn: warningLogger(this.session),
    };
    const validatedParts = validateTemplateParts(parts, templateYml?.parts || [], options, opts);
    if (validatedParts === undefined) {
      // Pass even if there are some validation errors; only error on total failure
      throw new Error(
        `Unable to parse "parts" for template ${this.getTemplateYmlPath()}${
          file ? ' from ' : ''
        }${file}`,
      );
    }
    return validatedParts;
  }

  validateDoc(
    frontmatter: any,
    options: Record<string, any>,
    bibliography?: string[],
    file?: string,
  ) {
    const templateYml = this.getValidatedTemplateYml();
    const opts: ValidationOptions = {
      file,
      property: 'frontmatter',
      messages: {},
      errorLogFn: errorLogger(this.session),
      warningLogFn: warningLogger(this.session),
    };
    const bibFrontmatter = {
      ...frontmatter,
      bibliography: bibliography ?? frontmatter.bibliography,
    };
    const validatedDoc = validateTemplateDoc(bibFrontmatter, templateYml?.doc || [], options, opts);
    if (validatedDoc === undefined) {
      throw new Error(`Unable to read frontmatter${file ? ' from ' : ''}${file}`);
    }
    return validatedDoc;
  }

  async ensureTemplateExistsOnPath(force?: boolean) {
    if (!force && fs.existsSync(join(this.templatePath, TEMPLATE_FILENAME))) {
      this.session.log.info(`🔍 Template found at path: ${this.templatePath}`);
    } else if (!this.templateUrl) {
      throw new Error(
        `No template on path and no download URL to fetch from: ${this.templatePath}`,
      );
    } else {
      await downloadAndUnzipTemplate(this.session, {
        templatePath: this.templatePath,
        templateUrl: this.templateUrl,
      });
    }
  }

  preRender(opts: {
    frontmatter: any;
    parts: any;
    options: any;
    bibliography?: string[];
    sourceFile?: string;
  }) {
    if (!fs.existsSync(join(this.templatePath, TEMPLATE_FILENAME))) {
      throw new Error(
        `The template at "${join(this.templatePath, TEMPLATE_FILENAME)}" does not exist`,
      );
    }
    const options = this.validateOptions(opts.options, opts.sourceFile);
    const parts = this.validateParts(opts.parts, options, opts.sourceFile);
    const docFrontmatter = this.validateDoc(
      opts.frontmatter,
      options,
      opts.bibliography,
      opts.sourceFile,
    );
    const doc = extendJtexFrontmatter(docFrontmatter);
    return { options, parts, doc };
  }

  render(opts: {
    contentOrPath: string;
    outputPath: string;
    frontmatter: any;
    parts: any;
    options: any;
    bibliography?: string[];
    sourceFile?: string;
    imports?: string | TemplateImports;
    force?: boolean;
    packages?: string[];
  }) {
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
    const { options, parts, doc } = this.preRender(opts);
    const renderer: Renderer = {
      CONTENT: content,
      doc,
      parts,
      options,
      IMPORTS: renderImports(opts.imports, opts?.packages),
    };
    const rendered = this.env.render(TEMPLATE_FILENAME, renderer);
    const outputDirectory = dirname(opts.outputPath);
    ensureDirectoryExists(outputDirectory);
    this.copyTemplateFiles(dirname(opts.outputPath), { force: opts.force });
    fs.writeFileSync(opts.outputPath, `% Created with jtex v.${version}\n${rendered}`);
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

  pdfExportCommand(texFile: string, logFile: string) {
    const templateYml = this.getValidatedTemplateYml();
    return pdfExportCommand(texFile, logFile, templateYml.build?.engine);
  }
}

export default JTex;
