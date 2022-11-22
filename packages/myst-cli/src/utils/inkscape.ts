import fs from 'fs';
import path from 'path';
import { sync as which } from 'which';
import { makeExecutable } from 'myst-cli-utils';
import type { ISession } from '../session/types';

export function isInkscapeAvailable() {
  return which('inkscape', { nothrow: true });
}

export async function convertSVGToPNG(session: ISession, svg: string, writeFolder: string) {
  if (!fs.existsSync(svg)) return null;
  const { name, ext } = path.parse(svg);
  if (ext !== '.svg') return null;
  const pngFile = `${name}.png`;
  const png = path.join(writeFolder, pngFile);
  if (fs.existsSync(png)) {
    session.log.debug(`Cached file found for converted SVG: ${svg}`);
  } else {
    const convert = makeExecutable(
      `inkscape ${svg} --export-area-drawing --export-type=png --export-filename=${png}`,
      session.log,
    );
    try {
      await convert();
    } catch (err) {
      session.log.error(`Could not convert from SVG to PNG: ${svg} - ${err}`);
      return null;
    }
  }
  return pngFile;
}
