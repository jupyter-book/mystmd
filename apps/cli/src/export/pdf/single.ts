import fs from 'fs';
import path from 'path';
import type { VersionId } from '@curvenote/blocks';
import { ExportFormats } from '@curvenote/frontmatter';
import type { ISession } from '../../session/types';
import { createTempFolder } from '../../utils';
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

export function texExportOptionsFromPdf(pdfExp: ExportWithOutput, tempFolder?: string) {
  const outputTexFile = path.basename(pdfExp.output, path.extname(pdfExp.output)) + '.tex';
  let output: string;
  if (tempFolder) {
    output = path.join(tempFolder, outputTexFile);
  } else {
    output = path.join(path.dirname(pdfExp.output), outputTexFile);
  }
  return { ...pdfExp, format: ExportFormats.tex, output };
}

export async function localArticleToPdf(session: ISession, file: string, opts: TexExportOptions) {
  const pdfExportOptionsList = await collectExportOptions(
    session,
    file,
    ExportFormats.pdf,
    DEFAULT_PDF_FILENAME,
    opts,
  );
  // Just a normal loop so these output in serial in the CLI
  for (let index = 0; index < pdfExportOptionsList.length; index++) {
    const pdfExportOptions = pdfExportOptionsList[index];
    const tempFolder = createTempFolder();
    const texExportOptions = texExportOptionsFromPdf(pdfExportOptions, tempFolder);
    await runTexExport(session, file, texExportOptions, opts.templatePath);
    session.log.info(`🖨  Rendering pdf to ${pdfExportOptions.output}`);
    const tempPdf = await createPdfGivenTexExport(
      session,
      texExportOptions,
      false,
      opts.templatePath,
    );
    fs.copyFileSync(tempPdf, pdfExportOptions.output);
    session.log.debug(`Copied PDF file to ${pdfExportOptions.output}`);
  }
}
