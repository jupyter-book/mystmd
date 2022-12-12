import type MystTemplate from 'myst-templates';

export function pdfExportCommand(texFile: string, logFile: string, template?: MystTemplate) {
  const templateYml = template?.getValidatedTemplateYml();
  const engine = templateYml?.build?.engine ?? '-xelatex';
  return `latexmk -f ${engine} -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${texFile} &> ${logFile}`;
}
