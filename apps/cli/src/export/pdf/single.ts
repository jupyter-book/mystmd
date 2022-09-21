import path from 'path';
import { ExportFormats } from 'myst-frontmatter';
import type { VersionId } from '@curvenote/blocks';
import type { ISession } from '../../session/types';
import { createTempFolder, findProjectAndLoad } from '../../utils';
import { singleArticleToTex } from '../tex';
import {
  cleanOutput,
  collectExportOptions,
  resolveAndLogErrors,
  runTexExport,
} from '../tex/single';
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

export function texExportOptionsFromPdf(
  session: ISession,
  pdfExp: ExportWithOutput,
  keepTex?: boolean,
  clean?: boolean,
) {
  const basename = path.basename(pdfExp.output, path.extname(pdfExp.output));
  const outputTexFile = `${basename}.tex`;
  let output: string;
  if (keepTex) {
    const texOutputFolder = path.join(path.dirname(pdfExp.output), `${basename}_tex`);
    if (clean) cleanOutput(session, texOutputFolder);
    output = path.join(texOutputFolder, outputTexFile);
  } else {
    output = path.join(createTempFolder(), outputTexFile);
  }
  return { ...pdfExp, format: ExportFormats.tex, output };
}

export async function localArticleToPdf(session: ISession, file: string, opts: TexExportOptions) {
  const projectPath = await findProjectAndLoad(session, path.dirname(file));
  const pdfExportOptionsList = await collectExportOptions(
    session,
    file,
    'pdf',
    [ExportFormats.pdf, ExportFormats.pdftex],
    projectPath,
    opts,
  );
  await resolveAndLogErrors(
    session,
    pdfExportOptionsList
      .map(async (exportOptions) => {
        const { format, output } = exportOptions;
        const keepTexAndLogs = format === ExportFormats.pdftex;
        const texExportOptions = texExportOptionsFromPdf(
          session,
          exportOptions,
          keepTexAndLogs,
          opts.clean,
        );
        await runTexExport(
          session,
          file,
          texExportOptions,
          opts.templatePath,
          projectPath,
          opts.clean,
        );
        await createPdfGivenTexExport(
          session,
          texExportOptions,
          output,
          opts.templatePath,
          keepTexAndLogs,
          opts.clean,
        );
      })
      .map((p) => p.catch((e) => e)),
  );
}
