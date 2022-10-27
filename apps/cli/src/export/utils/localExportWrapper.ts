import fs from 'fs';
import { createTempFolder, getDefaultExportFolder } from 'myst-cli';
import { ExportFormats } from 'myst-frontmatter';
import type { LinkTransformer } from 'myst-transforms';
import { join } from 'path';
import { OxaTransformer } from '../../transforms';
import type { ISession } from '../../session/types';
import { oxaLinkToMarkdown } from '../markdown';

export const localExportWrapper =
  (
    exportLocalArticle: (
      session: ISession,
      path: string,
      opts: { filename: string } & Record<string, any>,
      templateOptions?: Record<string, any>,
      extraLinkTransformers?: LinkTransformer[],
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
      const localFolder = createTempFolder(session);
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
    await exportLocalArticle(session, localPath, { filename, ...opts }, templateOptions, [
      new OxaTransformer(session),
    ]);
  };
