import { createCommand } from '../utils.js';

export function pdfTypstExportCommand(texFile: string, logFile: string): string {
  const baseCommand = `typst compile ${texFile}`;
  return createCommand(baseCommand, logFile);
}
