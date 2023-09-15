import path from 'node:path';
import type MystTemplate from 'myst-templates';

export function pdfExportCommand(texFile: string, logFile: string, template?: MystTemplate): string {
  const templateYml = template?.getValidatedTemplateYml();
  const engine = templateYml?.build?.engine ?? '-xelatex';
  if (process.platform === 'win32') {
    return `latexmk -f ${engine} -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${texFile} 1> ${logFile} 2>&1`;
  } else {
    return `latexmk -f ${engine} -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${texFile} &> ${logFile}`;
  }
}

export function texMakeGlossariesCommand(texFile: string): string {
  const fileNameNoExt = path.basename(texFile, '.tex');
  return `makeglossaries ${fileNameNoExt}`;
}
