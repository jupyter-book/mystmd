import fs from 'fs';
import { createTempFolder, getDefaultExportFolder } from 'myst-cli';
import { ExportFormats } from 'myst-frontmatter';
import { join } from 'path';
import type { ISession } from '../../session/types';
import { oxaLinkToMarkdown } from '../markdown';

export const localExportWrapper =
  (
    exportLocalArticle: (
      session: ISession,
      path: string,
      opts: { filename: string } & Record<string, any>,
      templateOptions?: Record<string, any>,
    ) => Promise<void>,
    outputFormat: ExportFormats,
  ) =>
  async (
    session: ISession,
    path: string,
    filename: string,
    opts: Record<string, any>,
    templateOptions?: Record<string, any>,
  ) => {
    let localPath: string;
    if (fs.existsSync(path)) {
      session.log.info(`🔍 Found local file to export: ${path}`);
      localPath = path;
    } else {
      session.log.info(`🌍 Downloading: ${path}`);
      const localFilename = 'output.md';
      const localFolder = createTempFolder();
      localPath = join(localFolder, localFilename);
      await oxaLinkToMarkdown(session, path, localFilename, { path: localFolder });
      if (!filename)
        filename = getDefaultExportFolder(
          session,
          localPath,
          '.',
          outputFormat === ExportFormats.tex ? 'tex' : undefined,
        );
    }
    await exportLocalArticle(session, localPath, { filename, ...opts }, templateOptions);
  };
