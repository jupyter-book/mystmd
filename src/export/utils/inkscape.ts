import { sync as which } from 'which';
import path from 'path';
import { Logger } from 'logging';
import { makeExecutable } from './exec';

export function isInkscapeAvailable() {
  return which('inkscape', { nothrow: true });
}

export async function convertSVGToPDF(
  svg: string,
  log: Logger,
  buildPath: string,
): Promise<string | null> {
  const dirname = path.dirname(svg);
  const basename = path.basename(svg, path.extname(svg));
  const pdf = path.join(dirname, `${basename}.pdf`);
  const convert = makeExecutable(
    `inkscape ${path.join(buildPath, svg)} --export-area-drawing --export-pdf=${path.join(
      buildPath,
      pdf,
    )}`,
    log,
  );
  try {
    await convert();
  } catch (err) {
    log.error(`Could not convert SVG to PDF ${err}`);
    return null;
  }
  return pdf;
}
