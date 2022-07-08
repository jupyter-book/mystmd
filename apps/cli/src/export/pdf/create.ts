import fs from 'fs';
import path from 'path';
import util from 'util';
import { Logger } from '../../logging';
import { exec } from '../utils';

const copyFile = util.promisify(fs.copyFile);

export async function createPdfGivenTexFile(log: Logger, filename: string, useBuildFolder = true) {
  const basename = path.basename(filename, path.extname(filename));
  const tex_filename = `${basename}.tex`;
  const pdf_filename = `${basename}.pdf`;
  const log_filename = `${basename}.log`;
  const tex_log_filename = `${basename}.shell.log`;
  const outputPath = path.dirname(filename);
  const outputPdfFile = path.join(outputPath, pdf_filename);
  const outputLogFile = path.join(outputPath, log_filename);

  const buildPath = path.resolve(useBuildFolder ? path.join(outputPath, '_build') : outputPath);
  const CMD = `latexmk -f -xelatex -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${tex_filename} &> ${tex_log_filename}`;
  try {
    log.debug(`Building LaTeX: logging output to ${tex_log_filename}`);
    await exec(CMD, { cwd: buildPath });
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
