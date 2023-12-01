import fs from 'node:fs';
import { extname, dirname } from 'node:path';
import { TemplateKind } from 'myst-common';
import type MystTemplate from 'myst-templates';
import { TEMPLATE_FILENAME } from 'myst-templates';
import nunjucks from 'nunjucks';
import { renderImports } from './render.js';
import type { TexRenderer, TypstTemplateImports, TexTemplateImports } from './types.js';
import version from './version.js';

function ensureDirectoryExists(directory: string) {
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
}

function getDefaultEnv(template: MystTemplate) {
  const env = nunjucks
    .configure(template.templatePath, {
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
  return env;
}

const KIND_TO_EXT: Record<TemplateKind, string | undefined> = {
  tex: '.tex',
  typst: '.typ',
  docx: undefined,
  site: undefined,
};

function commentSymbol(kind: string) {
  if (kind === TemplateKind.typst) return '//';
  return '%';
}

/**
 * Render a template from content
 *
 * Imports contains template-kind-specific import/command values; these are resolved
 * based on kind.
 * Preamble is content directly appended to resolved import value.
 * Packages are existing packages already included as part of the template.
 */
export function renderTemplate(
  template: MystTemplate,
  opts: {
    contentOrPath: string;
    imports?: TexTemplateImports | TypstTemplateImports;
    preamble?: string;
    packages?: string[];
    force?: boolean;
    frontmatter: any;
    parts: any;
    options: any;
    bibliography?: string;
    outputPath: string;
    sourceFile?: string;
    filesPath?: string;
  },
) {
  const ext = KIND_TO_EXT[template.kind];
  if (!ext) {
    throw new Error(`Cannot render template of kind: ${template.kind}`);
  }
  if (extname(opts.outputPath) !== ext) {
    throw new Error(`outputPath must be a "${ext}" file, not "${opts.outputPath}"`);
  }
  let content: string;
  if (fs.existsSync(opts.contentOrPath)) {
    template.session.log.debug(`Reading content from ${opts.contentOrPath}`);
    content = fs.readFileSync(opts.contentOrPath).toString();
  } else {
    content = opts.contentOrPath;
  }
  const { options, parts, doc } = template.prepare(opts);
  const importsContent = renderImports(
    template.kind,
    opts.outputPath,
    opts.imports,
    opts.packages,
    opts.preamble,
  );
  const renderer: TexRenderer = {
    CONTENT: content,
    doc,
    parts,
    options,
    IMPORTS: importsContent,
  };
  const env = getDefaultEnv(template);
  const rendered = env.render(TEMPLATE_FILENAME, renderer);
  const outputDirectory = dirname(opts.outputPath);
  ensureDirectoryExists(outputDirectory);
  template.copyTemplateFiles(dirname(opts.outputPath), { force: opts.force });
  fs.writeFileSync(
    opts.outputPath,
    `${commentSymbol(template.kind)} Created with jtex v.${version}\n${rendered}`,
  );
}
