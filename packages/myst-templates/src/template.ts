import fs from 'node:fs';
import { join, dirname } from 'node:path';
import yaml from 'js-yaml';
import type { TemplateKind } from 'myst-common';
import type { ValidationOptions } from 'simple-validators';
import { downloadTemplate, KIND_TO_EXT, resolveInputs, TEMPLATE_YML } from './download.js';
import { extendFrontmatter } from './frontmatter.js';
import type { TemplateYml, ISession } from './types.js';
import { debugLogger, errorLogger, warningLogger } from './utils.js';
import type { FileOptions, FileValidationOptions } from './validators.js';
import {
  validateTemplateDoc,
  validateTemplateOptions,
  validateTemplateParts,
  validateTemplateYml,
} from './validators.js';

const TEMPLATE_FILENAME_BASE = 'template';

class MystTemplate {
  session: ISession;
  kind: TemplateKind;
  templatePath: string;
  templateUrl: string | undefined;
  validatedTemplateYml: TemplateYml | undefined;
  errorLogFn: (message: string) => void;
  warningLogFn: (message: string) => void;
  debugLogFn: (message: string) => void;
  validateFiles: boolean;

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
    opts: {
      kind: TemplateKind;
      template?: string;
      buildDir?: string;
      errorLogFn?: (message: string) => void;
      warningLogFn?: (message: string) => void;
      debugLogFn?: (message: string) => void;
      validateFiles?: boolean;
    },
  ) {
    this.session = session;
    const { templatePath, templateUrl } = resolveInputs(this.session, opts || {});
    this.templatePath = templatePath;
    this.templateUrl = templateUrl;
    this.errorLogFn = opts?.errorLogFn ?? errorLogger(this.session);
    this.warningLogFn = opts?.warningLogFn ?? warningLogger(this.session);
    this.debugLogFn = opts?.debugLogFn ?? debugLogger(this.session);
    this.kind = opts.kind;
    this.validateFiles = opts?.validateFiles ?? true;
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
        errorLogFn: this.errorLogFn,
        warningLogFn: this.warningLogFn,
      };
      const templateYml = validateTemplateYml(this.session, this.getTemplateYml(), {
        ...opts,
        templateDir: this.templatePath,
        validateFiles: this.validateFiles,
      });
      if (opts.messages.errors?.length || templateYml === undefined) {
        // Strictly error if template.yml is invalid
        throw new Error(`Cannot use invalid ${TEMPLATE_YML}: ${this.getTemplateYmlPath()}`);
      }
      this.validatedTemplateYml = templateYml;
    }
    return this.validatedTemplateYml;
  }

  getTemplateFilename() {
    const templateYml = this.getValidatedTemplateYml();
    return templateYml.template ?? `${TEMPLATE_FILENAME_BASE}${KIND_TO_EXT[this.kind]}`;
  }

  validateOptions(options: any, file?: string, fileOpts?: FileOptions) {
    const templateYml = this.getValidatedTemplateYml();
    const opts: FileValidationOptions = {
      file,
      property: 'options',
      messages: {},
      errorLogFn: this.errorLogFn,
      // Warnings about extra options are just debug messages
      warningLogFn: this.debugLogFn,
      ...fileOpts,
    };
    const validatedOptions = validateTemplateOptions(
      this.session,
      options,
      templateYml?.options || [],
      opts,
    );
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
      errorLogFn: this.errorLogFn,
      warningLogFn: this.warningLogFn,
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
      errorLogFn: this.errorLogFn,
      warningLogFn: this.warningLogFn,
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

  async ensureTemplateExistsOnPath(force?: boolean): Promise<boolean> {
    if (!force && fs.existsSync(join(this.templatePath, TEMPLATE_YML))) {
      this.session.log.debug(`Template found: ${this.templatePath}`);
      return true;
    } else if (!this.templateUrl) {
      throw new Error(
        `No template on path and no download URL to fetch from: ${this.templatePath}`,
      );
    } else {
      try {
        await downloadTemplate(this.session, {
          templatePath: this.templatePath,
          templateUrl: this.templateUrl,
        });
        return false;
      } catch (error) {
        this.session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
        throw new Error(
          `${
            (error as Error).message
          }\n\nTo list valid templates, try the command "myst templates list"`,
        );
      }
    }
  }

  prepare(opts: {
    frontmatter: any;
    parts: any;
    options: any;
    bibliography?: string;
    outputPath?: string;
    sourceFile?: string;
    filesPath?: string;
  }) {
    if (!fs.existsSync(join(this.templatePath, TEMPLATE_YML))) {
      throw new Error(`The template at "${join(this.templatePath, TEMPLATE_YML)}" does not exist`);
    }
    const fileOpts: FileOptions = { copyFolder: opts.filesPath };
    if (opts.outputPath) {
      fileOpts.relativePathFrom = dirname(opts.outputPath);
    }
    const options = this.validateOptions(opts.options, opts.sourceFile, fileOpts);
    const parts = this.validateParts(opts.parts, options, opts.sourceFile);
    const docFrontmatter = this.validateDoc(
      opts.frontmatter,
      options,
      opts.bibliography ? [opts.bibliography] : [],
      opts.sourceFile,
    );
    const doc = extendFrontmatter(docFrontmatter);
    return { options, parts, doc };
  }

  copyTemplateFiles(outputDir: string, opts?: { force?: boolean }) {
    const templateYml = this.getValidatedTemplateYml();
    templateYml.files?.forEach((file) => {
      if (file === this.getTemplateFilename()) return;
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
