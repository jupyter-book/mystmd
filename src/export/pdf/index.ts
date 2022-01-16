import { VersionId } from '@curvenote/blocks';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { exportFromOxaLink, exec } from '../utils';
import { articleToTex } from '../tex';
import { TexExportOptions } from '../tex/types';
import { ISession } from '../../session/types';

const copyFile = util.promisify(fs.copyFile);

export async function articleToPdf(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
) {
  const basename = path.basename(opts.filename, path.extname(opts.filename));
  const tex_filename = `${basename}.tex`;
  const pdf_filename = `${basename}.pdf`;

  const article = await articleToTex(session, versionId, {
    ...opts,
    filename: tex_filename,
    template: opts.template ?? 'default',
    useBuildFolder: true,
    texIsIntermediate: true,
  });

  const CMD = `cd _build;latexmk -f -xelatex -synctex=1 -interaction=nonstopmode -file-line-error -latexoption="-shell-escape" ${tex_filename}`;
  try {
    await exec(CMD);
  } catch (err) {
    session.log.error(`Error while invoking mklatex: ${err}`);
  }

  const built_pdf = path.join('_build', pdf_filename);
  if (!fs.existsSync(built_pdf)) {
    session.log.error(`Could not find ${built_pdf} as expected, pdf export failed`);
    throw Error(`Could not find ${built_pdf} as expected, pdf export failed`);
  }

  await copyFile(built_pdf, pdf_filename);
  session.log.debug(`Copied PDF file to ${pdf_filename}`);

  return article;
}

export const oxaLinkToPdf = exportFromOxaLink(articleToPdf);
