import path from 'node:path';
import { ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../../config.js';
import { loadProjectFromDisk } from '../../project/index.js';
import type { ISession } from '../../session/index.js';
import type { ExportOptions, ExportWithInputOutput } from '../types.js';
import { resolveAndLogErrors } from './resolveAndLogErrors.js';
import { runTexZipExport, runTexExport } from '../tex/single.js';
import { runWordExport } from '../docx/single.js';
import { runJatsExport } from '../jats/single.js';
import { texExportOptionsFromPdf } from '../pdf/single.js';
import { createPdfGivenTexExport } from '../pdf/create.js';

export async function localArticleExport(
  session: ISession,
  exportOptionsList: ExportWithInputOutput[],
  opts: Pick<ExportOptions, 'clean' | 'projectPath' | 'throwOnFailure'>,
) {
  const { clean, projectPath } = opts;
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptionsWithFile) => {
      const { $file, $project, ...exportOptions } = exportOptionsWithFile;
      const { format, output } = exportOptions;
      const sessionClone = session.clone();
      const fileProjectPath =
        projectPath ??
        $project ??
        (await findCurrentProjectAndLoad(sessionClone, path.dirname($file)));
      if (fileProjectPath) {
        await loadProjectFromDisk(sessionClone, fileProjectPath);
      }
      if (format === ExportFormats.tex) {
        if (path.extname(output) === '.zip') {
          await runTexZipExport(sessionClone, $file, exportOptions, fileProjectPath, clean);
        } else {
          await runTexExport(sessionClone, $file, exportOptions, fileProjectPath, clean);
        }
      } else if (format === ExportFormats.docx) {
        await runWordExport(sessionClone, $file, exportOptions, fileProjectPath, clean);
      } else if (format === ExportFormats.xml) {
        await runJatsExport(sessionClone, exportOptions, fileProjectPath, clean);
      } else {
        const keepTexAndLogs = format === ExportFormats.pdftex;
        const texExportOptions = texExportOptionsFromPdf(
          sessionClone,
          exportOptions,
          keepTexAndLogs,
          clean,
        );
        await runTexExport(sessionClone, $file, texExportOptions, fileProjectPath, clean);
        await createPdfGivenTexExport(
          sessionClone,
          texExportOptions,
          output,
          keepTexAndLogs,
          clean,
        );
      }
    }),
    opts.throwOnFailure,
  );
}
