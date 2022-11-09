import path from 'path';
import { ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../../config';
import { loadProjectAndBibliography } from '../../project';
import type { ISession } from '../../session/types';
import { createTempFolder } from '../../utils';
import { collectTexExportOptions, runTexExport } from '../tex/single';
import type { ExportOptions, ExportWithOutput } from '../types';
import { resolveAndLogErrors, cleanOutput } from '../utils';
import { createPdfGivenTexExport, getTexOutputFolder } from './create';

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
    const texOutputFolder = getTexOutputFolder(pdfExp.output);
    if (clean) cleanOutput(session, texOutputFolder);
    output = path.join(texOutputFolder, outputTexFile);
  } else {
    output = path.join(createTempFolder(session), outputTexFile);
  }
  return { ...pdfExp, format: ExportFormats.tex, output };
}

export async function localArticleToPdf(
  session: ISession,
  file: string,
  opts: ExportOptions,
  templateOptions?: Record<string, any>,
) {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectAndBibliography(session, projectPath);
  const pdfExportOptionsList = (
    await collectTexExportOptions(
      session,
      file,
      'pdf',
      [ExportFormats.pdf, ExportFormats.pdftex],
      projectPath,
      opts,
    )
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    pdfExportOptionsList.map(async (exportOptions) => {
      const { format, output } = exportOptions;
      const keepTexAndLogs = format === ExportFormats.pdftex;
      const texExportOptions = texExportOptionsFromPdf(
        session,
        exportOptions,
        keepTexAndLogs,
        opts.clean,
      );
      await runTexExport(session, file, texExportOptions, projectPath, opts.clean);
      await createPdfGivenTexExport(session, texExportOptions, output, keepTexAndLogs, opts.clean);
    }),
  );
}
