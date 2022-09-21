export function pdfExportCommand(texFile: string, logFile: string, engine?: string) {
  if (!engine) engine = 'xelatex';
  return `latexmk -f -${engine} -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${texFile} &> ${logFile}`;
}
