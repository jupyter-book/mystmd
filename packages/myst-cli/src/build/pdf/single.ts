import path from 'node:path';
import { ExportFormats } from 'myst-frontmatter';
import type { ISession } from '../../session/types.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import type { ExportWithOutput } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { getTexOutputFolder } from './create.js';

export function texExportOptionsFromPdf(
  session: ISession,
  pdfExp: ExportWithOutput,
  keepTex?: boolean,
  clean?: boolean,
) {
  const basename = path.basename(pdfExp.output, path.extname(pdfExp.output));
  const outputTexFile = `${basename}.tex`;
  let output: string;
  if (keepTex) {
    const texOutputFolder = getTexOutputFolder(pdfExp.output);
    if (clean) cleanOutput(session, texOutputFolder);
    output = path.join(texOutputFolder, outputTexFile);
  } else {
    output = path.join(createTempFolder(session), outputTexFile);
  }
  return { ...pdfExp, format: ExportFormats.tex, output };
}
