import path from 'node:path';
import { ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../../config.js';
import { loadProjectFromDisk } from '../../project/load.js';
import type { ISession } from '../../session/types.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import { runTexExport } from '../tex/single.js';
import { typstExportRunner } from '../typst.js';
import type { ExportOptions, ExportResults, ExportWithOutput } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { collectTexExportOptions } from '../utils/collectExportOptions.js';
import { resolveAndLogErrors } from '../utils/resolveAndLogErrors.js';
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
): Promise<ExportResults> {
  let { projectPath } = opts;
  if (!projectPath) projectPath = findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const pdfExportOptionsList = (
    await collectTexExportOptions(
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
  console.log(pdfExportOptionsList);
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
