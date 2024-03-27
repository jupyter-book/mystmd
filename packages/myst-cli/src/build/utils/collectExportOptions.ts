import fs from 'node:fs';
import path from 'node:path';
import { RuleId, fileError, fileWarn } from 'myst-common';
import type { Export, ExportArticle } from 'myst-frontmatter';
import {
  EXT_TO_FORMAT,
  ExportFormats,
  MULTI_ARTICLE_EXPORT_FORMATS,
  singleArticleWithFile,
} from 'myst-frontmatter';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { validateTOC } from '../../utils/toc.js';
import { projectFromToc } from '../../project/fromToc.js';
import { loadProjectFromDisk } from '../../project/load.js';
import type { LocalProject } from '../../project/types.js';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import type {
  ExportWithOutput,
  ExportOptions,
  ExportWithInputOutput,
  ExportWithFormat,
} from '../types.js';
import { getExportListFromRawFrontmatter, getRawFrontmatterFromFile } from '../../frontmatter.js';
import { getDefaultExportFilename, getDefaultExportFolder } from './defaultNames.js';

export const SOURCE_EXTENSIONS = ['.ipynb', '.md', '.tex'];

type ResolvedArticles = Pick<Export, 'articles' | 'sub_articles'>;

export function resolveArticlesFromProject(
  exp: ExportWithFormat,
  proj: Omit<LocalProject, 'bibliography'>,
  vfile: VFile,
): ResolvedArticles {
  const { file, pages } = proj;
  const fileAsPage = { file, level: 1 };
  const articles = pages?.length ? pages : [fileAsPage];
  if (MULTI_ARTICLE_EXPORT_FORMATS.includes(exp.format)) {
    return { articles };
  }
  if (exp.format === ExportFormats.xml) {
    return {
      articles: [fileAsPage],
      sub_articles: pages
        .map((page) => (page as any).file)
        .filter((pageFile): pageFile is string => !!pageFile),
    };
  } else {
    if (articles.length > 1) {
      fileError(
        vfile,
        "multiple articles are only supported for 'tex', 'typst', and 'pdf' exports",
        {
          ruleId: RuleId.validFrontmatterExportList,
        },
      );
    }
    return { articles: [singleArticleWithFile(articles) ?? fileAsPage] };
  }
}

function resolveArticlesFromTOC(
  session: ISession,
  exp: ExportWithFormat,
  tocPath: string,
  vfile: VFile,
): ResolvedArticles {
  const allowLevelLessThanOne = [
    ExportFormats.tex,
    ExportFormats.pdf,
    ExportFormats.pdftex,
  ].includes(exp.format);
  const proj = projectFromToc(session, tocPath, allowLevelLessThanOne ? -1 : 1);
  return resolveArticlesFromProject(exp, proj, vfile);
}

/**
 * Resolve template to absolute path
 *
 * If `disableTemplate: true` template resolves to `null`
 *
 * Otherwise, if it exists on the path relative to the source file, it is
 * resolved to absolute path. If not, it is unchanged.
 */
export function resolveTemplate(
  sourceFile: string,
  exp: Export,
  disableTemplate?: boolean,
): string | null | undefined {
  if (disableTemplate) return null;
  if (exp.template) {
    const resolvedTemplatePath = path.resolve(path.dirname(sourceFile), exp.template);
    if (fs.existsSync(resolvedTemplatePath)) {
      return resolvedTemplatePath;
    }
  }
  return exp.template;
}

/**
 * Resolve format based on export format/template/output
 *
 * User-provided `format` is prioritized, then `template` type, then `output` file extension.
 * (Validation ensures one of format/output/template is provided.)
 *
 * If `format` or `output` give PDF export, we look at the template kind and switch to `typst`
 * in the case of a typst template.
 */
export function resolveFormat(vfile: VFile, exp: Export): ExportFormats | undefined {
  // Explicit format is always respected except for PDF, which may mean typst.
  if (exp.format && exp.format !== ExportFormats.pdf) {
    return exp.format;
  }
  // Default if we cannot figure anything else out from output or template
  let suggestedPdfFormat = ExportFormats.pdf;
  let suggestedOutputFormat: ExportFormats | undefined;
  if (exp.output) {
    const ext = path.extname(exp.output);
    if (!ext) {
      // If its a folder and we have no other info, fall back to pdftex format instead of pdf
      suggestedPdfFormat = ExportFormats.pdftex;
    } else {
      // Unknown output extensions are ignored here, but will raise errors later on type/extension mismatch
      suggestedOutputFormat = EXT_TO_FORMAT[ext];
    }
  }
  if (!exp.template) {
    if (exp.format) return suggestedPdfFormat;
    return suggestedOutputFormat ?? suggestedPdfFormat;
  }
  if (exp.template.endsWith('-tex')) return suggestedPdfFormat;
  if (exp.template.endsWith('-typst')) return ExportFormats.typst;
  if (exp.template.endsWith('-docx')) return ExportFormats.docx;
  if (fs.existsSync(exp.template)) {
    const templateFiles = fs.readdirSync(exp.template);
    const templateTexFiles = templateFiles.filter((file) => file.endsWith('.tex'));
    const templateTypFiles = templateFiles.filter((file) => file.endsWith('.typ'));
    if (templateTexFiles.length && !templateTypFiles.length) return suggestedPdfFormat;
    if (!templateTexFiles.length && templateTypFiles.length) return ExportFormats.typst;
  }
  fileError(
    vfile,
    `Cannot determine export type from template ${exp.template} - you must specify export 'format'`,
    { ruleId: RuleId.exportFormatDetermined },
  );
  return undefined;
}

/**
 * Resolve articles and sub_articles based on explicit or implicit table of contents
 *
 * This also takes into account format, to determine if multiple articles or sub_articles
 * are allowed.
 */
export function resolveArticles(
  session: ISession,
  sourceFile: string,
  vfile: VFile,
  exp: ExportWithFormat,
  projectPath?: string,
) {
  const { articles, sub_articles } = exp;
  let resolved: ResolvedArticles = { articles, sub_articles };
  // First, respect explicit toc. If articles/sub_articles are already defined, toc is ignored.
  if (exp.toc && !resolved.articles && !resolved.sub_articles) {
    const resolvedToc = path.resolve(path.dirname(sourceFile), exp.toc);
    if (validateTOC(session, resolvedToc)) {
      resolved = resolveArticlesFromTOC(session, exp, resolvedToc, vfile);
    }
  }
  // If no articles are specified, use the sourceFile for article
  if (!resolved.articles && SOURCE_EXTENSIONS.includes(path.extname(sourceFile))) {
    resolved.articles = [{ file: path.resolve(sourceFile) }];
  }
  // If there is only one article with no explicit level, it should be 0, making the first section depth 1.
  if (resolved.articles?.length === 1 && resolved.articles[0].level == null) {
    resolved.articles[0].level = 0;
  }
  // If still no articles, try to use explicit or implicit project toc
  if (!resolved.articles && !resolved.sub_articles) {
    if (validateTOC(session, projectPath ?? '.')) {
      resolved = resolveArticlesFromTOC(session, exp, projectPath ?? '.', vfile);
    } else {
      const cachedProject = selectors.selectLocalProject(
        session.store.getState(),
        projectPath ?? '.',
      );
      if (cachedProject) {
        resolved = resolveArticlesFromProject(exp, cachedProject, vfile);
      }
    }
  }
  if (!resolved.articles?.length && exp.format !== ExportFormats.meca) {
    fileError(vfile, `Unable to resolve any 'articles' to export`, {
      ruleId: RuleId.exportArticleExists,
    });
    return resolved;
  }

  // Convert articles and sub_articles to relative path and ensure existence
  resolved.articles = resolved.articles
    ?.map((article) => {
      if (!article.file) return article;
      const resolvedFile = path.resolve(path.dirname(sourceFile), article.file);
      if (!fs.existsSync(resolvedFile)) {
        fileError(vfile, `Invalid export article - '${article.file}' does not exist`, {
          ruleId: RuleId.exportArticleExists,
        });
        return undefined;
      }
      return { ...article, file: resolvedFile };
    })
    .filter((article): article is ExportArticle => !!article);

  resolved.sub_articles = resolved.sub_articles
    ?.map((file: string) => {
      const resolvedFile = path.resolve(path.dirname(sourceFile), file);
      if (!fs.existsSync(resolvedFile)) {
        fileError(vfile, `Invalid export sub_article - '${file}' does not exist`, {
          ruleId: RuleId.exportArticleExists,
        });
        return undefined;
      } else {
        return resolvedFile;
      }
    })
    .filter((resolvedFile: string | undefined): resolvedFile is string => !!resolvedFile);
  return resolved;
}

const ALLOWED_EXTENSIONS: Record<ExportFormats, string[]> = {
  [ExportFormats.docx]: ['.doc', '.docx'],
  [ExportFormats.md]: ['.md'],
  [ExportFormats.meca]: ['.zip', '.meca'],
  [ExportFormats.pdf]: ['.pdf'],
  [ExportFormats.pdftex]: ['.pdf', '.tex', '.zip'],
  [ExportFormats.tex]: ['.tex', '.zip'],
  [ExportFormats.typst]: ['.pdf', '.typ', '.typst', '.zip'],
  [ExportFormats.xml]: ['.xml', '.jats'],
};

/**
 * Resolve output based on format and existing output value
 *
 * By default, this will generate a file with a valid extension in
 * the _build directory.
 *
 * If output is provided with a valid extension, it is respected.
 * If output is provided with an invalid extension, an error is logged.
 * If output has no extension, it is assumed to be the output folder and
 * will be used in place of the _build directory.
 */
export function resolveOutput(
  session: ISession,
  sourceFile: string,
  vfile: VFile,
  exp: ExportWithFormat,
  projectPath?: string,
) {
  let output: string;
  if (exp.output) {
    // output path from file frontmatter needs resolution relative to working directory
    output = path.resolve(path.dirname(sourceFile), exp.output);
  } else {
    output = getDefaultExportFolder(session, sourceFile, exp.format, projectPath);
  }
  if (exp.format === ExportFormats.meca && exp.zip === false) {
    fileWarn(vfile, `ignoring "zip: false" for export of format "${ExportFormats.meca}"`);
  }
  if (exp.zip && !ALLOWED_EXTENSIONS[exp.format]?.includes('.zip')) {
    fileWarn(vfile, `ignoring "zip: true" for export of format "${exp.format}"`);
    exp.zip = false;
  }
  if (!path.extname(output)) {
    const basename = getDefaultExportFilename(
      session,
      singleArticleWithFile(exp.articles)?.file ?? sourceFile,
      projectPath,
    );
    const ext = exp.zip ? '.zip' : ALLOWED_EXTENSIONS[exp.format]?.[0];
    output = path.join(output, `${basename}${ext ?? ''}`);
  }
  if (!ALLOWED_EXTENSIONS[exp.format]?.includes(path.extname(output))) {
    fileError(
      vfile,
      `Output file "${output}" has invalid extension for export format of "${exp.format}"`,
      { ruleId: RuleId.exportExtensionCorrect },
    );
    return undefined;
  }
  if (exp.zip && path.extname(output) !== '.zip') {
    fileWarn(
      vfile,
      `Output file "${output}" has non-zip extension but "zip: true" is specified; ignoring "zip: true"`,
      { ruleId: RuleId.exportExtensionCorrect },
    );
  }
  return output;
}

/**
 * Pull export lists from files, resolve format/template values, and filter based on desired formats
 *
 * @param sourceFile
 * @param formats desired output formats
 * @param projectPath
 * @param opts.disableTemplate override templating for raw, untemplated outputs
 */
async function resolveFileExportFormats(
  session: ISession,
  sourceFile: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
): Promise<ExportWithFormat[]> {
  const { disableTemplate } = opts;
  const vfile = new VFile();
  vfile.path = sourceFile;
  let rawFrontmatter: Record<string, any> | undefined;
  const state = session.store.getState();
  if (
    projectPath &&
    path.resolve(sourceFile) === selectors.selectLocalConfigFile(state, projectPath)
  ) {
    rawFrontmatter = selectors.selectLocalProjectConfig(state, projectPath);
  } else {
    rawFrontmatter = await getRawFrontmatterFromFile(session, sourceFile, projectPath);
  }
  const exportList = getExportListFromRawFrontmatter(session, rawFrontmatter, sourceFile);

  const exportListWithFormat = exportList
    .map((exp) => {
      const template = resolveTemplate(sourceFile, exp, disableTemplate);
      const format = resolveFormat(vfile, exp);
      if (!format || !formats.includes(format)) return undefined;
      return { ...exp, template, format } as ExportWithFormat;
    })
    .filter((exp): exp is ExportWithFormat => !!exp);
  logMessagesFromVFile(session, vfile);
  return exportListWithFormat;
}

/**
 * Resolve export list with formats to export list with articles and outputs
 */
export function resolveExportArticles(
  session: ISession,
  sourceFile: string,
  exportList: ExportWithFormat[],
  projectPath: string | undefined,
  opts: ExportOptions,
): ExportWithOutput[] {
  const { renderer } = opts;

  const vfile = new VFile();
  vfile.path = sourceFile;
  const filteredExportOptions = exportList
    .map((exp) => {
      const { articles, sub_articles } = resolveArticles(
        session,
        sourceFile,
        vfile,
        exp,
        projectPath,
      );
      if (!articles?.length && exp.format !== ExportFormats.meca) {
        // All export formats except meca require article(s)
        return undefined;
      }
      const output = resolveOutput(session, sourceFile, vfile, exp, projectPath);
      if (!output) return undefined;
      return { ...exp, output, articles, sub_articles, renderer } as ExportWithOutput;
    })
    .filter((exp): exp is ExportWithOutput => !!exp);
  logMessagesFromVFile(session, vfile);
  return filteredExportOptions;
}

function filterAndMakeUnique<T extends ExportWithOutput>(exports: (T | undefined)[]): T[] {
  return exports
    .filter((exp): exp is T => Boolean(exp))
    .map((exp, ind, arr) => {
      // Make identical export output values unique
      const nMatch = (a: ExportWithOutput[]) => a.filter((e) => e.output === exp.output).length;
      if (nMatch(arr) === 1) return { ...exp };
      const { dir, name, ext } = path.parse(exp.output);
      return {
        ...exp,
        output: path.join(dir, `${name}_${nMatch(arr.slice(0, ind))}${ext}`),
      };
    });
}

/**
 * Given source files and desired export formats, collect all export objects
 *
 * @param files source files to inspect for exports
 * @param formats list of requested ExportFormat types
 * @param opts export options, mostly passed in from the command line
 * @param opts.projectPath if provided, exports will also be loaded from the project config
 */
export async function collectExportOptions(
  session: ISession,
  files: string[],
  formats: ExportFormats[],
  opts: ExportOptions,
) {
  const { projectPath } = opts;
  const sourceFiles = [...files];
  if (projectPath) {
    await loadProjectFromDisk(session, projectPath);
    const configFile = selectors.selectLocalConfigFile(session.store.getState(), projectPath);
    if (configFile) sourceFiles.push(configFile);
  }
  const exportOptionsList: ExportWithInputOutput[] = [];
  await Promise.all(
    sourceFiles.map(async (file) => {
      let fileProjectPath: string | undefined;
      if (!projectPath) {
        fileProjectPath = findCurrentProjectAndLoad(session, path.dirname(file));
        if (fileProjectPath) await loadProjectFromDisk(session, fileProjectPath);
      } else {
        fileProjectPath = projectPath;
      }
      const fileExports = await resolveFileExportFormats(
        session,
        file,
        formats,
        fileProjectPath,
        opts,
      );
      const fileExportOptionsList = resolveExportArticles(
        session,
        file,
        fileExports,
        fileProjectPath,
        opts,
      );
      exportOptionsList.push(
        ...fileExportOptionsList.map((exportOptions) => {
          return { ...exportOptions, $file: file, $project: fileProjectPath };
        }),
      );
    }),
  );
  return filterAndMakeUnique(exportOptionsList);
}

/**
 * Legacy exportOptions support to maintain exported functionality
 */
async function legacyCollectExportOptions(
  session: ISession,
  sourceFile: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
) {
  if (!extension.startsWith('.')) extension = `.${extension}`;
  let extensionIsOk = false;
  formats.forEach((fmt) => {
    if (ALLOWED_EXTENSIONS[fmt].includes(extension)) extensionIsOk = true;
  });
  if (!extensionIsOk) {
    throw new Error(`invalid extension for export of formats ${formats.join(', ')} "${extension}"`);
  }
  if (opts.template && opts.disableTemplate) {
    throw new Error(`cannot specify template "${opts.template}" and "disable template"`);
  }
  // Handle explicitly requested exports
  if (opts.filename || opts.template) {
    const explicitExport: ExportWithFormat = {
      format: formats[0],
      template: opts.disableTemplate ? null : opts.template,
      output: opts.filename,
    };
    return resolveExportArticles(session, sourceFile, [explicitExport], projectPath, opts);
  }
  // Handle exports defined in project config / file frontmatter
  const exportOptions = await collectExportOptions(session, [sourceFile], formats, {
    ...opts,
    projectPath,
  });
  if (exportOptions.length > 0) return exportOptions;
  // Handle fallback if no exports are explicitly requested and no exports are found in files
  const implicitExport: ExportWithFormat = {
    format: formats[0],
    template: opts.disableTemplate ? null : undefined,
  };
  return resolveExportArticles(session, sourceFile, [implicitExport], projectPath, opts);
}

export const collectTexExportOptions = legacyCollectExportOptions;
export const collectBasicExportOptions = legacyCollectExportOptions;
export const collectWordExportOptions = legacyCollectExportOptions;
