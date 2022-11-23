import fs from 'fs';
import path from 'path';
import { sync as which } from 'which';
import { makeExecutable } from 'myst-cli-utils';
import type { ISession } from '../session/types';

export function isImageMagickAvailable() {
  return which('convert', { nothrow: true });
}

export async function extractFirstFrameOfGif(session: ISession, gif: string, writeFolder: string) {
  if (!fs.existsSync(gif)) return null;
  const { name, ext } = path.parse(gif);
  if (ext !== '.gif') return null;
  const pngFile = `${name}.png`;
  const png = path.join(writeFolder, pngFile);
  if (fs.existsSync(png)) {
    session.log.debug(`Cached file found for extracted GIF: ${gif}`);
  } else {
    const executable = `convert ${gif}[0] ${png}`;
    session.log.debug(`Executing: ${executable}`);
    const convert = makeExecutable(executable, session.log);
    try {
      await convert();
    } catch (err) {
      session.log.error(`Could not extract an image from gif: ${gif} - ${err}`);
      return null;
    }
  }
  return pngFile;
}

export async function convertSvgToPng(session: ISession, svg: string, writeFolder: string) {
  if (!fs.existsSync(svg)) return null;
  const { name, ext } = path.parse(svg);
  if (ext !== '.svg') return null;
  const pngFile = `${name}.png`;
  const png = path.join(writeFolder, pngFile);
  if (fs.existsSync(png)) {
    session.log.debug(`Cached file found for converted SVG: ${svg}`);
  } else {
    const executable = `convert -density 600 ${svg} ${png}`;
    session.log.debug(`Executing: ${executable}`);
    const convert = makeExecutable(executable, session.log);
    try {
      await convert();
    } catch (err) {
      session.log.error(`Could not convert from SVG to PNG: ${svg} - ${err}`);
      return null;
    }
  }
  return pngFile;
}
