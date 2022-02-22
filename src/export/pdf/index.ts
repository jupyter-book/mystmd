import { VersionId } from '@curvenote/blocks';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { Logger } from 'logging';
import { exportFromOxaLink, exec } from '../utils';
import { singleArticleToTex } from '../tex';
import { TexExportOptions } from '../tex/types';
import { ISession } from '../../session/types';

const copyFile = util.promisify(fs.copyFile);

export async function createPdfGivenTexFile(log: Logger, filename: string) {
  const basename = path.basename(filename, path.extname(filename));
  const tex_filename = `${basename}.tex`;
  const pdf_filename = `${basename}.pdf`;
  const log_filename = `${basename}.log`;
  const tex_log_filename = `${basename}.shell.log`;
  const outputPath = path.dirname(filename);
  const outputPdfFile = path.join(outputPath, pdf_filename);
  const outputLogFile = path.join(outputPath, log_filename);

  const buildPath = path.join(outputPath, '_build');
  const CMD = `cd ${buildPath};latexmk -f -xelatex -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${tex_filename} &> ${tex_log_filename}`;
  try {
    log.debug(`Building LaTeX: logging output to ${tex_log_filename}`);
    await exec(CMD);
    log.debug(`Done building LaTeX.`);
  } catch (err) {
    log.error(`Error while invoking mklatex: ${err}`);
  }

  const built_pdf = path.join(buildPath, pdf_filename);
  if (fs.existsSync(built_pdf)) {
    await copyFile(built_pdf, outputPdfFile);
    log.debug(`Copied PDF file to ${outputPdfFile}`);
  } else {
    log.error(`Could not find ${built_pdf} as expected, pdf export failed`);
    throw Error(`Could not find ${built_pdf} as expected, pdf export failed`);
  }

  const built_log = path.join(buildPath, log_filename);
  if (fs.existsSync(built_log)) {
    await copyFile(built_log, outputLogFile);
  }
}

export async function articleToPdf(
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

export const oxaLinkToPdf = exportFromOxaLink(articleToPdf);
