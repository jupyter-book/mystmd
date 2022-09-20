import path from 'path';
import { ExportFormats } from 'myst-frontmatter';
import type { VersionId } from '@curvenote/blocks';
import type { ISession } from '../../session/types';
import { createTempFolder, findProject } from '../../utils';
import { singleArticleToTex } from '../tex';
import { collectExportOptions, runTexExport } from '../tex/single';
import type { ExportWithOutput, TexExportOptions } from '../tex/types';
import { createPdfGivenTexFile, createPdfGivenTexExport } from './create';

export const DEFAULT_PDF_FILENAME = 'main.pdf';

export async function singleArticleToPdf(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
) {
  if (!opts.filename) opts.filename = DEFAULT_PDF_FILENAME;
  const outputPath = path.dirname(opts.filename);
  const basename = path.basename(opts.filename, path.extname(opts.filename));
  const tex_filename = `${basename}.tex`;
  const targetTexFilename = path.join(outputPath, tex_filename);

  const article = await singleArticleToTex(session, versionId, {
    ...opts,
    filename: targetTexFilename,
    template: opts.template ?? 'public/default',
    useBuildFolder: true,
    texIsIntermediate: true,
  });

  await createPdfGivenTexFile(session.log, targetTexFilename);

  return article;
}

export function texExportOptionsFromPdf(pdfExp: ExportWithOutput, keepTex?: boolean) {
  const outputTexFile = path.basename(pdfExp.output, path.extname(pdfExp.output)) + '.tex';
  let output: string;
  if (keepTex) {
    output = path.join(path.dirname(pdfExp.output), 'tex', outputTexFile);
  } else {
    output = path.join(createTempFolder(), outputTexFile);
  }
  return { ...pdfExp, format: ExportFormats.tex, output };
}

export async function localArticleToPdf(session: ISession, file: string, opts: TexExportOptions) {
  const projectPath = findProject(session, path.dirname(file));
  const pdfExportOptionsList = await collectExportOptions(
    session,
    file,
    'pdf',
    [ExportFormats.pdf, ExportFormats.pdftex],
    DEFAULT_PDF_FILENAME,
    projectPath,
    opts,
  );
  await Promise.all(
    pdfExportOptionsList.map(async (exportOptions) => {
      const { format, output } = exportOptions;
      const keepTexAndLogs = format === ExportFormats.pdftex;
      const texExportOptions = texExportOptionsFromPdf(exportOptions, keepTexAndLogs);
      await runTexExport(session, file, texExportOptions, opts.templatePath, projectPath);
      await createPdfGivenTexExport(
        session,
        texExportOptions,
        output,
        opts.templatePath,
        keepTexAndLogs,
      );
    }),
  );
}
