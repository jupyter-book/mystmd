import path from 'node:path';
import { ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../../config.js';
import { loadProjectFromDisk } from '../../project/index.js';
import type { ISession } from '../../session/types.js';
import { createTempFolder } from '../../utils/index.js';
import { runTexExport } from '../tex/single.js';
import type { ExportOptions, ExportWithOutput } from '../types.js';
import { collectTexExportOptions, resolveAndLogErrors, cleanOutput } from '../utils/index.js';
import { createPdfGivenTexExport, getTexOutputFolder } from './create.js';

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
  if (projectPath) await loadProjectFromDisk(session, projectPath);
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
    opts.throwOnFailure,
  );
}
