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
  const outputPath = path.dirname(opts.filename);
  const basename = path.basename(opts.filename, path.extname(opts.filename));
  const tex_filename = `${basename}.tex`;
  const pdf_filename = `${basename}.pdf`;
  const log_filename = `${basename}.log`;
  const tex_log_filename = `${basename}.shell.log`;
  const targetTexFilePath = path.join(outputPath, tex_filename);
  const outputPdfFile = path.join(outputPath, pdf_filename);
  const outputLogFile = path.join(outputPath, log_filename);

  const article = await articleToTex(session, versionId, {
    ...opts,
    filename: targetTexFilePath,
    template: opts.template ?? 'public/default',
    useBuildFolder: true,
    texIsIntermediate: true,
  });

  const buildPath = path.join(outputPath, '_build');
  const CMD = `cd ${buildPath};latexmk -f -xelatex -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${tex_filename} &> ${tex_log_filename}`;
  try {
    session.log.debug(`Building LaTeX: logging output to ${tex_log_filename}`);
    await exec(CMD);
    session.log.debug(`Done building LaTeX.`);
  } catch (err) {
    session.log.error(`Error while invoking mklatex: ${err}`);
  }

  const built_pdf = path.join(buildPath, pdf_filename);
  if (fs.existsSync(built_pdf)) {
    await copyFile(built_pdf, outputPdfFile);
    session.log.debug(`Copied PDF file to ${outputPdfFile}`);
  } else {
    session.log.error(`Could not find ${built_pdf} as expected, pdf export failed`);
    throw Error(`Could not find ${built_pdf} as expected, pdf export failed`);
  }

  const built_log = path.join(buildPath, log_filename);
  if (fs.existsSync(built_log)) {
    await copyFile(built_log, outputLogFile);
  }

  return article;
}

export const oxaLinkToPdf = exportFromOxaLink(articleToPdf);
