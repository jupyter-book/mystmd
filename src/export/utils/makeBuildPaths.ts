import path from 'path';
import fs from 'fs';
import { TexExportOptions } from '~/export/tex/types';
import { Logger } from '~/logging';

export function makeBuildPaths(log: Logger, opts: TexExportOptions) {
  const outputPath = path.dirname(opts.filename);
  const outputFilename = path.basename(opts.filename);
  const buildPath =
    opts.useBuildFolder ?? (opts.template || opts.templatePath)
      ? path.join(outputPath, '_build')
      : outputPath;
  log.debug(`Output Path ${outputPath}`);
  log.debug(`Filename ${outputFilename}`);
  log.debug(`Build path set to ${buildPath}`);
  if (!fs.existsSync(buildPath)) {
    log.debug(`Creating build path ${buildPath}`);
    fs.mkdirSync(buildPath, { recursive: true });
  }
  return {
    buildPath,
    outputPath,
    outputFilename,
  };
}
