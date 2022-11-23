import fs from 'fs';
import path from 'path';
import { sync as which } from 'which';
import { makeExecutable } from 'myst-cli-utils';
import type { ISession } from '../session/types';

export function isInkscapeAvailable() {
  return which('inkscape', { nothrow: true });
}

async function convertSvgTo(format: string, session: ISession, svg: string, writeFolder: string) {
  if (!fs.existsSync(svg)) return null;
  const { name, ext } = path.parse(svg);
  if (ext !== '.svg') return null;
  const filename = `${name}.${format}`;
  const output = path.join(writeFolder, filename);
  if (fs.existsSync(output)) {
    session.log.debug(`Cached file found for converted SVG: ${svg}`);
  } else {
    const convert = makeExecutable(
      `inkscape ${svg} --export-area-drawing --export-type=${format} --export-filename=${output}`,
      session.log,
    );
    try {
      await convert();
    } catch (err) {
      session.log.error(`Could not convert from SVG to ${format.toUpperCase()}: ${svg} - ${err}`);
      return null;
    }
  }
  return filename;
}

export async function convertSvgToPng(session: ISession, svg: string, writeFolder: string) {
  const pngFile = await convertSvgTo('png', session, svg, writeFolder);
  return pngFile;
}

export async function convertSvgToPdf(session: ISession, svg: string, writeFolder: string) {
  const pngFile = await convertSvgTo('pdf', session, svg, writeFolder);
  return pngFile;
}
