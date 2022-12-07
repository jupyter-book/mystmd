import path from 'path';
import { ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../../config';
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
      let fileProjectPath: string | undefined;
      if (!projectPath) {
        fileProjectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
        if (fileProjectPath) await loadProjectAndBibliography(session, fileProjectPath);
      } else {
        fileProjectPath = projectPath;
      }
      const fileExportOptionsList: ExportWithOutput[] = [];
      if (formats.includes(ExportFormats.docx)) {
        fileExportOptionsList.push(
          ...(await collectWordExportOptions(
            session,
            file,
            'docx',
            [ExportFormats.docx],
            fileProjectPath,
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
            fileProjectPath,
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
            fileProjectPath,
            opts,
          )),
        );
      }
      exportOptionsList.push(
        ...fileExportOptionsList.map((exportOptions) => {
          return { ...exportOptions, $file: file, $project: fileProjectPath };
        }),
      );
    }),
  );
  return exportOptionsList;
}
