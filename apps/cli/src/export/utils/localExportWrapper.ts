import fs from 'fs';
import { join } from 'path';
import { createTempFolder } from 'src/utils';
import type { ISession } from '../../session/types';
import { oxaLinkToMarkdown } from '../markdown';
import { getDefaultExportFolder } from './defaultNames';
import type { ArticleState } from './walkArticle';

export const localExportWrapper =
  (
    exportLocalArticle: (
      session: ISession,
      path: string,
      opts: { filename: string },
    ) => Promise<ArticleState | void>,
  ) =>
  async (session: ISession, path: string, filename: string, opts?: Record<string, string>) => {
    let localPath: string;
    if (fs.existsSync(path)) {
      session.log.info(`🔍 Found local file to export: ${path}`);
      localPath = path;
    } else {
      session.log.info(`🌍 Attempting to download: ${path}`);
      const localFilename = 'output.md';
      const localFolder = createTempFolder();
      localPath = join(localFolder, localFilename);
      await oxaLinkToMarkdown(session, path, localFilename, { path: localFolder });
      if (!filename) filename = getDefaultExportFolder(session, localPath, '.', 'tex');
    }
    await exportLocalArticle(session, localPath, { filename, ...opts });
  };
