import fs from 'fs';
import { ExportFormats } from 'myst-frontmatter';
import { join } from 'path';
import type { ISession } from '../../session/types';
import { createTempFolder } from '../../utils';
import { oxaLinkToMarkdown } from '../markdown';
import { getDefaultExportFolder } from './defaultNames';

export const localExportWrapper =
  <T extends Record<string, any>>(
    exportLocalArticle: (
      session: ISession,
      path: string,
      opts: T & { filename: string },
      templateOptions?: Record<string, any>,
    ) => Promise<void>,
    outputFormat: ExportFormats,
  ) =>
  async (
    session: ISession,
    path: string,
    filename: string,
    opts: T,
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
