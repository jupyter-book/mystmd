import { TexExportOptions } from 'export/tex/types';
import { Logger } from 'logging';
import path from 'path';
import fs from 'fs';

export function makeBuildPaths(log: Logger, opts: TexExportOptions) {
  const outputPath = path.dirname(opts.filename);
  const outputFilename = path.basename(opts.filename);
  const buildPath =
    opts.useBuildFolder ?? !!opts.template ? path.join(outputPath, '_build') : outputPath;
  log.info(`Output Path ${outputPath}`);
  log.info(`Filename ${outputFilename}`);
  log.info(`Build path set to ${buildPath}`);
  if (!fs.existsSync(buildPath)) fs.mkdirSync(path.dirname(buildPath), { recursive: true });
  return {
    buildPath,
    outputPath,
    outputFilename,
  };
}
