import path from 'node:path';
import type MystTemplate from 'myst-templates';
import { createCommand } from '../utils.js';

export function pdfTexExportCommand(
  texFile: string,
  logFile: string,
  template?: MystTemplate,
): string {
  const templateYml = template?.getValidatedTemplateYml();
  const baseCommand = `tectonic -X compile --keep-intermediates --keep-logs ${texFile}`;
  return createCommand(baseCommand, logFile);
}

export function texMakeGlossariesCommand(texFile: string, logFile: string): string {
  const fileNameNoExt = path.basename(texFile, '.tex');
  const baseCommand = `makeglossaries ${fileNameNoExt}`;

  return createCommand(baseCommand, logFile);
}
