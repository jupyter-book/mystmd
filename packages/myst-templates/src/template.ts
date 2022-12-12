import fs from 'fs';
import { join, dirname } from 'path';
import yaml from 'js-yaml';
import type { ValidationOptions } from 'simple-validators';
import type { TemplateKinds } from './download';
import { downloadTemplate, resolveInputs, TEMPLATE_FILENAME, TEMPLATE_YML } from './download';
import { extendFrontmatter } from './frontmatter';
import type { TemplateYml, ISession } from './types';
import { errorLogger, warningLogger } from './utils';
import {
  validateTemplateDoc,
  validateTemplateOptions,
  validateTemplateParts,
  validateTemplateYml,
} from './validators';

class MystTemplate {
  session: ISession;
  templatePath: string;
  templateUrl: string | undefined;
  validatedTemplateYml: TemplateYml | undefined;

  /**
   * MystTemplate class for template download / validation / render preparation
   *
   * Constructor takes a session object for logging and optional template/path.
   * Template may be a path to an existing template on disk, a URL where the zipped
   * template may be downloaded, or the name of a myst-template. Path is the
   * local path where the downloaded template will be saved.
   */
  constructor(
    session: ISession,
    opts?: { kind?: TemplateKinds; template?: string; buildDir?: string },
  ) {
    this.session = session;
    const { templatePath, templateUrl } = resolveInputs(this.session, opts || {});
    this.templatePath = templatePath;
    this.templateUrl = templateUrl;
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
    if (!force && fs.existsSync(join(this.templatePath, TEMPLATE_YML))) {
      this.session.log.debug(`Template found: ${this.templatePath}`);
    } else if (!this.templateUrl) {
      throw new Error(
        `No template on path and no download URL to fetch from: ${this.templatePath}`,
      );
    } else {
      await downloadTemplate(this.session, {
        templatePath: this.templatePath,
        templateUrl: this.templateUrl,
      });
    }
  }

  prepare(opts: {
    frontmatter: any;
    parts: any;
    options: any;
    bibliography?: string[];
    sourceFile?: string;
  }) {
    if (!fs.existsSync(join(this.templatePath, TEMPLATE_YML))) {
      throw new Error(`The template at "${join(this.templatePath, TEMPLATE_YML)}" does not exist`);
    }
    const options = this.validateOptions(opts.options, opts.sourceFile);
    const parts = this.validateParts(opts.parts, options, opts.sourceFile);
    const docFrontmatter = this.validateDoc(
      opts.frontmatter,
      options,
      opts.bibliography,
      opts.sourceFile,
    );
    const doc = extendFrontmatter(docFrontmatter);
    return { options, parts, doc };
  }

  copyTemplateFiles(outputDir: string, opts?: { force?: boolean }) {
    const templateYml = this.getValidatedTemplateYml();
    templateYml.files?.forEach((file) => {
      if (file === TEMPLATE_FILENAME) return;
      const source = join(this.templatePath, ...file.split('/'));
      const dest = join(outputDir, ...file.split('/'));
      if (fs.existsSync(dest)) {
        if (!opts?.force) {
          this.session.log.debug(`Template files ${file} already exists, not copying.`);
          return;
        }
        fs.rmSync(dest);
      }
      fs.mkdirSync(dirname(dest), { recursive: true });
      fs.copyFileSync(source, dest);
    });
  }
}

export default MystTemplate;
