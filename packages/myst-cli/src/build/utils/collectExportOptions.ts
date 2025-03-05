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
import type { TOC } from 'myst-toc';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { validateSphinxTOC } from '../../utils/toc.js';
import { projectFromTOC, projectFromSphinxTOC } from '../../project/fromTOC.js';

import { loadProjectFromDisk } from '../../project/load.js';
import type { LocalProject, PageLevels } from '../../project/types.js';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import type {
  ExportWithOutput,
  ExportWithInputOutput,
  ExportWithFormat,
  RendererFn,
} from '../types.js';
import { getExportListFromRawFrontmatter } from '../../frontmatter.js';
import { getDefaultExportFilename, getDefaultExportFolder } from './defaultNames.js';
import { getRawFrontmatterFromFile } from '../../process/file.js';

export const SOURCE_EXTENSIONS = ['.ipynb', '.md', '.tex', '.myst.json'];

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
  if (exp.format === ExportFormats.xml || exp.format === ExportFormats.meca) {
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
  toc: TOC,
  projectPath: string,
  vfile: VFile,
): ResolvedArticles {
  const allowLevelLessThanOne = [
    ExportFormats.tex,
    ExportFormats.pdf,
    ExportFormats.pdftex,
  ].includes(exp.format);
  let level: PageLevels = 1;
  if (!allowLevelLessThanOne && exp.top_level && exp.top_level !== 'sections') {
    fileWarn(vfile, `top_level cannot be specified for export of format '${exp.format}'`, {
      ruleId: RuleId.validFrontmatterExportList,
    });
  } else if (exp.top_level === 'parts') {
    level = -1;
  } else if (exp.top_level === 'chapters') {
    level = 0;
  }
  const proj = projectFromTOC(session, projectPath, toc, level, vfile.path);
  return resolveArticlesFromProject(exp, proj, vfile);
}

function resolveArticlesFromSphinxTOC(
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
  const proj = projectFromSphinxTOC(session, tocPath, allowLevelLessThanOne ? -1 : 1);
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
  if (exp.template?.endsWith('-tex')) return suggestedPdfFormat;
  if (exp.template?.endsWith('-typst')) return ExportFormats.typst;
  if (exp.template?.endsWith('-docx')) return ExportFormats.docx;
  if (exp.template && fs.existsSync(exp.template)) {
    const templateFiles = fs.readdirSync(exp.template);
    const templateTexFiles = templateFiles.filter((file) => file.endsWith('.tex'));
    const templateTypFiles = templateFiles.filter((file) => file.endsWith('.typ'));
    if (templateTexFiles.length && !templateTypFiles.length) return suggestedPdfFormat;
    if (!templateTexFiles.length && templateTypFiles.length) return ExportFormats.typst;
  }
  if (exp.format) return suggestedPdfFormat;
  return suggestedOutputFormat ?? suggestedPdfFormat;
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
  projectPath = projectPath ?? '.';
  let resolved: ResolvedArticles = { articles, sub_articles };
  let warnAboutExpTopLevel = !!exp.top_level;
  // First, respect explicit toc or toc file. If articles/sub_articles are already defined, toc is ignored.
  if (!resolved.articles && !resolved.sub_articles) {
    if (exp.toc) {
      warnAboutExpTopLevel = false;
      resolved = resolveArticlesFromTOC(session, exp, exp.toc, projectPath, vfile);
    } else if (exp.tocFile && validateSphinxTOC(session, exp.tocFile)) {
      resolved = resolveArticlesFromSphinxTOC(session, exp, exp.tocFile, vfile);
    }
  }
  // If no articles are specified, use the sourceFile for article
  if (!resolved.articles && SOURCE_EXTENSIONS.some((ext) => sourceFile.endsWith(ext))) {
    resolved.articles = [{ file: path.resolve(sourceFile) }];
  }
  // If there is only one article with no explicit level, it should be 0, making the first section depth 1.
  if (resolved.articles?.length === 1 && resolved.articles[0].level == null) {
    resolved.articles[0].level = 0;
  }
  // If still no articles, try to use explicit or implicit project toc
  if (!resolved.articles && !resolved.sub_articles) {
    const state = session.store.getState();
    const projectConfig = selectors.selectLocalProjectConfig(state, projectPath);
    if (projectConfig?.toc) {
      warnAboutExpTopLevel = false;
      resolved = resolveArticlesFromTOC(session, exp, projectConfig.toc, projectPath, vfile);
    } else if (validateSphinxTOC(session, projectPath)) {
      // If the only explicit toc is in a _toc.yml file
      resolved = resolveArticlesFromSphinxTOC(session, exp, projectPath, vfile);
    } else {
      const cachedProject = selectors.selectLocalProject(state, projectPath);
      if (cachedProject) {
        resolved = resolveArticlesFromProject(exp, cachedProject, vfile);
      }
    }
  }
  if (warnAboutExpTopLevel) {
    fileWarn(
      vfile,
      `top_level may only be used if toc is defined in your export or project config`,
      {
        ruleId: RuleId.validFrontmatterExportList,
      },
    );
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

export const ALLOWED_EXTENSIONS: Record<ExportFormats, string[]> = {
  [ExportFormats.docx]: ['.doc', '.docx'],
  [ExportFormats.md]: ['.md'],
  [ExportFormats.ipynb]: ['.ipynb'],
  [ExportFormats.meca]: ['.zip', '.meca'],
  [ExportFormats.pdf]: ['.pdf'],
  [ExportFormats.pdftex]: ['.pdf', '.tex', '.zip'],
  [ExportFormats.tex]: ['.tex', '.zip'],
  [ExportFormats.typst]: ['.pdf', '.typ', '.typst', '.zip'],
  [ExportFormats.xml]: ['.xml', '.jats'],
  [ExportFormats.cff]: ['.cff'],
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
  } else if (exp.format === ExportFormats.cff && projectPath) {
    output = projectPath;
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
    let basename: string;
    if (exp.format === ExportFormats.cff) {
      basename = 'CITATION';
    } else {
      basename = getDefaultExportFilename(
        session,
        singleArticleWithFile(exp.articles)?.file ?? sourceFile,
        projectPath,
      );
    }
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

export type CollectionOptions = {
  projectPath?: string;
  disableTemplate?: boolean;
  renderer?: RendererFn;
};

/**
 * Pull export lists from files and resolve template values
 *
 * @param sourceFile
 * @param projectPath
 * @param opts.disableTemplate override templating for raw, untemplated outputs
 */
async function getExportListFromFile(
  session: ISession,
  sourceFile: string,
  projectPath: string | undefined,
  opts: CollectionOptions,
): Promise<Export[]> {
  const { disableTemplate } = opts;
  const rawFrontmatter = await getRawFrontmatterFromFile(session, sourceFile, projectPath);
  const exportList = getExportListFromRawFrontmatter(session, rawFrontmatter, sourceFile);
  const exportListWithTemplate = exportList
    .map((exp) => {
      const template = resolveTemplate(sourceFile, exp, disableTemplate);
      return { ...exp, template } as Export;
    })
    .filter((exp): exp is Export => !!exp);
  return exportListWithTemplate;
}

/**
 * Resolve formats on export list and filter based on desired formats
 *
 * @param sourceFile
 * @param formats desired output formats
 * @param exportList list of export objects from a file or defined explicitly
 */
export function resolveExportListFormats(
  session: ISession,
  sourceFile: string,
  formats: ExportFormats[],
  exportList: Export[],
): ExportWithFormat[] {
  const vfile = new VFile();
  vfile.path = sourceFile;
  const exportListWithFormat = exportList
    .map((exp) => {
      const format = resolveFormat(vfile, exp);
      if (!format || !formats.includes(format)) return undefined;
      return { ...exp, format } as ExportWithFormat;
    })
    .filter((exp): exp is ExportWithFormat => !!exp);
  logMessagesFromVFile(session, vfile);
  return exportListWithFormat;
}

const FORMATS_ALLOW_NO_ARTICLES = [ExportFormats.meca, ExportFormats.cff];

/**
 * Resolve export list with formats to export list with articles and outputs
 */
export function resolveExportListArticles(
  session: ISession,
  sourceFile: string,
  exportList: ExportWithFormat[],
  projectPath: string | undefined,
  opts: CollectionOptions,
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
      if (!articles?.length && !FORMATS_ALLOW_NO_ARTICLES.includes(exp.format)) {
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
  opts: CollectionOptions,
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
        fileProjectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
        if (fileProjectPath) await loadProjectFromDisk(session, fileProjectPath);
      } else {
        fileProjectPath = projectPath;
      }
      const fileExports = await getExportListFromFile(session, file, fileProjectPath, opts);
      const fileExportsWithFormat = resolveExportListFormats(session, file, formats, fileExports);
      const fileExportsResolved = resolveExportListArticles(
        session,
        file,
        fileExportsWithFormat,
        fileProjectPath,
        opts,
      );
      exportOptionsList.push(
        ...fileExportsResolved.map((exportOptions) => {
          return { ...exportOptions, $file: file, $project: fileProjectPath };
        }),
      );
    }),
  );
  return filterAndMakeUnique(exportOptionsList);
}
