import { VersionId } from '@curvenote/blocks';
import path from 'path';
import { singleArticleToTex } from '../tex';
import { TexExportOptions } from '../tex/types';
import { ISession } from '../../session/types';
import { createPdfGivenTexFile } from './create';

export async function singleArticleToPdf(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
) {
  const outputPath = path.dirname(opts.filename);
  const basename = path.basename(opts.filename, path.extname(opts.filename));
  const tex_filename = `${basename}.tex`;
  const targetTexFilename = path.join(outputPath, tex_filename);

  const article = await singleArticleToTex(session, versionId, {
    ...opts,
    filename: targetTexFilename,
    template: opts.template ?? 'public/default',
    useBuildFolder: true,
    texIsIntermediate: true,
  });

  await createPdfGivenTexFile(session.log, targetTexFilename);

  return article;
}
