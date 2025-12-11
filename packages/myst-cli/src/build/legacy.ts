import path from 'node:path';
import { ExportFormats } from 'myst-frontmatter';
import type { LinkTransformer } from 'myst-transforms';
import { findCurrentProjectAndLoad } from '../config.js';
import { loadProjectFromDisk } from '../project/load.js';
import type { ISession } from '../session/types.js';
import { runWordExport } from './docx/single.js';
import { runJatsExport } from './jats/single.js';
import { runMdExport } from './md/index.js';
import { runMecaExport } from './meca/index.js';
import { texExportOptionsFromPdf } from './pdf/single.js';
import { runTexExport, runTexZipExport } from './tex/single.js';
import { createPdfGivenTexExport } from './pdf/create.js';
import type { ExportResults, ExportWithOutput, RendererFn } from './types.js';
import { resolveAndLogErrors } from './utils/resolveAndLogErrors.js';
import { runTypstExport, runTypstPdfExport, runTypstZipExport } from './typst.js';
import {
  ALLOWED_EXTENSIONS,
  collectExportOptions,
  resolveExportListArticles,
  resolveExportListFormats,
} from './utils/collectExportOptions.js';

export type LocalArticleExportOptions = {
  filename?: string;
  template?: string | null;
  disableTemplate?: boolean;
  templateOptions?: Record<string, any>;
  clean?: boolean;
  glossaries?: boolean;
  zip?: boolean;
  projectPath?: string;
  watch?: boolean;
  throwOnFailure?: boolean;
  ci?: boolean;
  renderer?: RendererFn;
};

/**
 * @deprecated Use localArticleExport function with resolved docx export options
 */
export async function localArticleToWord(
  session: ISession,
  file: string,
  opts: LocalArticleExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await legacyCollectExportOptions(session, file, 'docx', [ExportFormats.docx], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { tempFolders: [] };
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      const exportResult = await runWordExport(session, file, exportOptions, {
        projectPath,
        clean: opts.clean,
        extraLinkTransformers,
      });
      results.tempFolders.push(...exportResult.tempFolders);
    }),
    opts.throwOnFailure,
  );
  return results;
}

/**
 * @deprecated Use localArticleExport function with resolved jats export options
 */
export async function localArticleToJats(
  session: ISession,
  file: string,
  opts: LocalArticleExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
) {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await legacyCollectExportOptions(session, file, 'xml', [ExportFormats.xml], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { tempFolders: [] };
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      const exportResults = await runJatsExport(session, file, exportOptions, {
        projectPath,
        clean: opts.clean,
        extraLinkTransformers,
      });
      results.tempFolders.push(...exportResults.tempFolders);
    }),
    opts.throwOnFailure,
  );
  return results;
}

/**
 * @deprecated Use localArticleExport function with resolved md export options
 */
export async function localArticleToMd(
  session: ISession,
  file: string,
  opts: LocalArticleExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
) {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await legacyCollectExportOptions(session, file, 'md', [ExportFormats.md], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runMdExport(session, file, exportOptions, {
        projectPath,
        clean: opts.clean,
        extraLinkTransformers,
      });
    }),
    opts.throwOnFailure,
  );
}

/**
 * @deprecated Use localArticleExport function with resolved meca export options
 */
export async function localProjectToMeca(
  session: ISession,
  file: string,
  opts: LocalArticleExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
) {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await legacyCollectExportOptions(session, file, 'zip', [ExportFormats.meca], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { tempFolders: [] };
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      const exportResults = await runMecaExport(session, file, exportOptions, {
        projectPath,
        clean: opts.clean,
        extraLinkTransformers,
      });
      results.tempFolders.push(...exportResults.tempFolders);
    }),
    opts.throwOnFailure,
  );
  return results;
}

/**
 * @deprecated Use localArticleExport function with resolved pdf export options
 */
export async function localArticleToPdf(
  session: ISession,
  file: string,
  opts: LocalArticleExportOptions,
  templateOptions?: Record<string, any>,
): Promise<ExportResults> {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const pdfExportOptionsList = (
    await legacyCollectExportOptions(
      session,
      file,
      'pdf',
      [ExportFormats.pdf, ExportFormats.pdftex, ExportFormats.typst],
      projectPath,
      opts,
    )
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { logFiles: [], tempFolders: [] };
  await resolveAndLogErrors(
    session,
    pdfExportOptionsList.map(async (exportOptions) => {
      const { format, output } = exportOptions;
      if (format === ExportFormats.typst) {
        const typstExportResults = await typstExportRunner(
          session,
          file,
          opts,
          exportOptions,
          projectPath,
        );
        results.tempFolders.push(...typstExportResults.tempFolders);
        return;
      }
      const keepTexAndLogs = format === ExportFormats.pdftex;
      const texExportOptions = texExportOptionsFromPdf(
        session,
        exportOptions,
        keepTexAndLogs,
        opts.clean,
      );
      const texExportResults = await runTexExport(session, file, texExportOptions, {
        projectPath,
        clean: opts.clean,
      });
      const pdfExportResults = await createPdfGivenTexExport(
        session,
        texExportOptions,
        output,
        keepTexAndLogs,
        opts.clean,
      );
      results.tempFolders.push(...texExportResults.tempFolders, ...pdfExportResults.tempFolders);
      if (!keepTexAndLogs) {
        results.tempFolders.push(path.dirname(texExportOptions.output));
      }
      results.logFiles?.push(...(pdfExportResults.logFiles ?? []));
    }),
    opts.throwOnFailure,
  );
  return results;
}

/**
 * @deprecated Use localArticleExport function with resolved tex export options
 */
export async function localArticleToTex(
  session: ISession,
  file: string,
  opts: LocalArticleExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await legacyCollectExportOptions(session, file, 'tex', [ExportFormats.tex], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { tempFolders: [] };
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      let exportResults: ExportResults;
      if (path.extname(exportOptions.output) === '.zip') {
        exportResults = await runTexZipExport(session, file, exportOptions, {
          projectPath,
          clean: opts.clean,
          extraLinkTransformers,
        });
      } else {
        exportResults = await runTexExport(session, file, exportOptions, {
          projectPath,
          clean: opts.clean,
          extraLinkTransformers,
        });
      }
      results.tempFolders.push(...exportResults.tempFolders);
    }),
    opts.throwOnFailure,
  );
  return results;
}

async function typstExportRunner(
  session: ISession,
  file: string,
  opts: LocalArticleExportOptions,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  let exportResults: ExportResults;
  if (path.extname(exportOptions.output) === '.zip') {
    exportResults = await runTypstZipExport(session, file, exportOptions, {
      projectPath,
      clean: opts.clean,
      extraLinkTransformers,
    });
  } else if (path.extname(exportOptions.output) === '.pdf') {
    exportResults = await runTypstPdfExport(session, file, exportOptions, {
      projectPath,
      clean: opts.clean,
      extraLinkTransformers,
    });
  } else {
    exportResults = await runTypstExport(session, file, exportOptions, {
      projectPath,
      clean: opts.clean,
      extraLinkTransformers,
    });
  }
  return exportResults;
}

/**
 * @deprecated Use localArticleExport function with resolved typst export options
 */
export async function localArticleToTypst(
  session: ISession,
  file: string,
  opts: LocalArticleExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await legacyCollectExportOptions(session, file, 'typ', [ExportFormats.typst], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { tempFolders: [] };
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      const exportResults = await typstExportRunner(
        session,
        file,
        opts,
        exportOptions,
        projectPath,
        extraLinkTransformers,
      );
      results.tempFolders.push(...exportResults.tempFolders);
    }),
    opts.throwOnFailure,
  );
  return results;
}

async function legacyCollectExportOptions(
  session: ISession,
  sourceFile: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: LocalArticleExportOptions,
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
    const explicitExports = resolveExportListFormats(session, sourceFile, formats, [
      {
        format: formats[0],
        template: opts.disableTemplate ? null : opts.template,
        output: opts.filename,
      },
    ]);
    return resolveExportListArticles(session, sourceFile, explicitExports, projectPath, opts);
  }
  // Handle exports defined in project config / file frontmatter
  const exportOptions = await collectExportOptions(session, [sourceFile], formats, {
    ...opts,
    projectPath,
  });
  if (exportOptions.length > 0) return exportOptions;
  // Handle fallback if no exports are explicitly requested and no exports are found in files
  const implicitExports = resolveExportListFormats(session, sourceFile, formats, [
    {
      format: formats[0],
      template: opts.disableTemplate ? null : undefined,
    },
  ]);
  return resolveExportListArticles(session, sourceFile, implicitExports, projectPath, opts);
}
