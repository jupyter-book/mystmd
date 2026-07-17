import { createCommand } from '../utils.js';

export function pdfTypstExportCommand(typstFile: string, logFile: string): string {
  const baseCommand = `typst compile "${typstFile}"`;
  return createCommand(baseCommand, logFile);
}
