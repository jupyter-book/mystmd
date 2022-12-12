import path from 'path';
import { ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../../config';
import { loadProjectFromDisk } from '../../project';
import type { ISession } from '../../session';
import type { ExportOptions, ExportWithInputOutput } from '../types';
import { resolveAndLogErrors } from './resolveAndLogErrors';
import { runTexZipExport, runTexExport } from '../tex/single';
import { runWordExport } from '../docx/single';
import { texExportOptionsFromPdf } from '../pdf/single';
import { createPdfGivenTexExport } from '../pdf/create';

export async function localArticleExport(
  session: ISession,
  exportOptionsList: ExportWithInputOutput[],
  opts: Pick<ExportOptions, 'clean' | 'projectPath'>,
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
  );
}
