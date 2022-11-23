import fs from 'fs';
import path from 'path';
import { sync as which } from 'which';
import type { LoggerDE } from 'myst-cli-utils';
import { makeExecutable } from 'myst-cli-utils';
import type { ISession } from '../session/types';

function createInkscpapeLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      session.log.debug(line);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      // These are non-critical errors that don't need to be in the CLI log
      if (line.includes('unsupported target') || line.includes('writable cache directories')) {
        session.log.debug(line);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}

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
    const inkscapeCommand = `inkscape ${svg} --export-area-drawing --export-type=${format} --export-filename=${output}`;
    session.log.debug(`Executing: ${inkscapeCommand}`);
    const convert = makeExecutable(inkscapeCommand, createInkscpapeLogger(session));
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
