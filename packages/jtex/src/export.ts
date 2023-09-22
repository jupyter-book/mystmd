import path from 'node:path';
import type MystTemplate from 'myst-templates';

export function pdfExportCommand(
  texFile: string,
  logFile: string,
  template?: MystTemplate,
): string {
  const templateYml = template?.getValidatedTemplateYml();
  const engine = templateYml?.build?.engine ?? '-xelatex';
  const baseCommand = `latexmk -f ${engine} -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${texFile}`;

  return createCommand(baseCommand, logFile);
}

export function texMakeGlossariesCommand(texFile: string, logFile: string): string {
  const fileNameNoExt = path.basename(texFile, '.tex');
  const baseCommand = `makeglossaries ${fileNameNoExt}`;

  return createCommand(baseCommand, logFile);
}

function createCommand(baseCommand: string, logFile: string): string {
  return process.platform === 'win32'
    ? `${baseCommand} 1> ${logFile} 2>&1`
    : `${baseCommand} &> ${logFile}`;
}
