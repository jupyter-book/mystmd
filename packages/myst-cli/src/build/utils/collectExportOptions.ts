import { ExportFormats } from 'myst-frontmatter';
import { loadProjectAndBibliography } from '../../project';
import type { ISession } from '../../session';
import { collectWordExportOptions } from '../docx/single';
import { collectTexExportOptions } from '../tex/single';
import type { ExportWithOutput, ExportOptions, ExportWithInputOutput } from '../types';

export async function collectExportOptions(
  session: ISession,
  files: string[],
  formats: ExportFormats[],
  opts: ExportOptions,
) {
  const { projectPath } = opts;
  if (projectPath) await loadProjectAndBibliography(session, projectPath);
  const exportOptionsList: ExportWithInputOutput[] = [];
  await Promise.all(
    files.map(async (file) => {
      const fileExportOptionsList: ExportWithOutput[] = [];
      if (formats.includes(ExportFormats.docx)) {
        fileExportOptionsList.push(
          ...(await collectWordExportOptions(
            session,
            file,
            'docx',
            [ExportFormats.docx],
            projectPath,
            opts,
          )),
        );
      }
      if (formats.includes(ExportFormats.pdf) || formats.includes(ExportFormats.pdftex)) {
        fileExportOptionsList.push(
          ...(await collectTexExportOptions(
            session,
            file,
            'pdf',
            [ExportFormats.pdf, ExportFormats.pdftex],
            projectPath,
            opts,
          )),
        );
      }
      if (formats.includes(ExportFormats.tex)) {
        fileExportOptionsList.push(
          ...(await collectTexExportOptions(
            session,
            file,
            'tex',
            [ExportFormats.tex],
            projectPath,
            opts,
          )),
        );
      }
      exportOptionsList.push(
        ...fileExportOptionsList.map((exportOptions) => {
          return { ...exportOptions, $file: file };
        }),
      );
    }),
  );
  return exportOptionsList;
}
