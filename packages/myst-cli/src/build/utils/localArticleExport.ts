import path from 'node:path';
import { ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../../config.js';
import { loadProjectFromDisk } from '../../project/index.js';
import type { ISession } from '../../session/index.js';
import type { ExportOptions, ExportResults, ExportWithInputOutput } from '../types.js';
import { resolveAndLogErrors } from './resolveAndLogErrors.js';
import { runTexZipExport, runTexExport } from '../tex/single.js';
import { runTypstExport, runTypstZipExport } from '../typst.js';
import { runWordExport } from '../docx/single.js';
import { runJatsExport } from '../jats/single.js';
import { texExportOptionsFromPdf } from '../pdf/single.js';
import { createPdfGivenTexExport } from '../pdf/create.js';
import { runMecaExport } from '../meca/index.js';
import { runMdExport } from '../md/index.js';

async function _localArticleExport(
  session: ISession,
  exportOptionsList: ExportWithInputOutput[],
  opts: Pick<ExportOptions, 'clean' | 'projectPath' | 'throwOnFailure' | 'glossaries'>,
) {
  const { clean, projectPath } = opts;
  const errors = await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptionsWithFile) => {
      const { $file, $project, ...exportOptions } = exportOptionsWithFile;
      const { format, output } = exportOptions;
      const sessionClone = session.clone();
      const fileProjectPath =
        projectPath ?? $project ?? findCurrentProjectAndLoad(sessionClone, path.dirname($file));

      let exportResults: ExportResults | undefined;
      if (fileProjectPath) {
        await loadProjectFromDisk(sessionClone, fileProjectPath);
      }
      if (format === ExportFormats.tex) {
        if (path.extname(output) === '.zip') {
          exportResults = await runTexZipExport(
            sessionClone,
            $file,
            exportOptions,
            fileProjectPath,
            clean,
          );
        } else {
          exportResults = await runTexExport(
            sessionClone,
            $file,
            exportOptions,
            fileProjectPath,
            clean,
          );
        }
      } else if (format === ExportFormats.typst) {
        if (path.extname(output) === '.zip') {
          exportResults = await runTypstZipExport(
            sessionClone,
            $file,
            exportOptions,
            fileProjectPath,
            clean,
          );
        } else {
          exportResults = await runTypstExport(
            sessionClone,
            $file,
            exportOptions,
            fileProjectPath,
            clean,
          );
        }
      } else if (format === ExportFormats.docx) {
        exportResults = await runWordExport(
          sessionClone,
          $file,
          exportOptions,
          fileProjectPath,
          clean,
        );
      } else if (format === ExportFormats.xml) {
        await runJatsExport(sessionClone, exportOptions, fileProjectPath, clean);
      } else if (format === ExportFormats.md) {
        await runMdExport(sessionClone, exportOptions, fileProjectPath, clean);
      } else if (format === ExportFormats.meca) {
        await runMecaExport(sessionClone, exportOptions, fileProjectPath, clean);
      } else {
        const keepTexAndLogs = format === ExportFormats.pdftex;
        const texExportOptions = texExportOptionsFromPdf(
          sessionClone,
          exportOptions,
          keepTexAndLogs,
          clean,
        );
        exportResults = await runTexExport(
          sessionClone,
          $file,
          texExportOptions,
          fileProjectPath,
          clean,
        );
        await createPdfGivenTexExport(
          sessionClone,
          texExportOptions,
          output,
          keepTexAndLogs,
          clean,
          exportResults.hasGlossaries,
        );
      }
    }),
    opts.throwOnFailure,
  );
  return errors;
}

export async function localArticleExport(
  session: ISession,
  exportOptionsList: ExportWithInputOutput[],
  opts: Pick<ExportOptions, 'clean' | 'projectPath' | 'throwOnFailure'>,
) {
  // We must perform other exports before MECA, since MECA includes the others
  const errors = await _localArticleExport(
    session,
    exportOptionsList.filter((expOpts) => expOpts.format !== ExportFormats.meca),
    { ...opts, throwOnFailure: false },
  );
  await _localArticleExport(
    session,
    exportOptionsList.filter((expOpts) => expOpts.format === ExportFormats.meca),
    opts,
  );
  if (opts.throwOnFailure && errors.length) throw errors[0];
}
