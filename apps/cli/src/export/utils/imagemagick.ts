import { sync as which } from 'which';
import fs from 'fs';
import path from 'path';
import { Logger } from '../../logging';
import { makeExecutable } from './exec';
import { ISession } from '../../session';
import { tic } from '../../utils';

export function isWebpAvailable() {
  return which('cwebp', { nothrow: true });
}

export function isGif2webpAvailable() {
  return which('gif2webp', { nothrow: true });
}

export function isImageMagickAvailable() {
  return which('convert', { nothrow: true });
}

export async function extractFirstFrameOfGif(
  gif: string,
  log: Logger,
  buildPath: string,
): Promise<string | null> {
  const dirname = path.dirname(gif);
  const basename = path.basename(gif, path.extname(gif));
  const png = path.join(dirname, `${basename}.png`);
  const convert = makeExecutable(
    `convert ${path.join(buildPath, gif)}[0] ${path.join(buildPath, png)}`,
    log,
  );
  try {
    await convert();
  } catch (err) {
    log.error(`Could not extract an image from gif ${err}`);
    return null;
  }
  return png;
}

export async function convertSVGToPNG(
  svg: string,
  log: Logger,
  buildPath: string,
): Promise<string | null> {
  const dirname = path.dirname(svg);
  const basename = path.basename(svg, path.extname(svg));
  const png = path.join(dirname, `${basename}.png`);
  const convert = makeExecutable(
    `convert ${path.join(buildPath, svg)} -density 600 ${path.join(buildPath, png)}`,
    log,
  );
  try {
    await convert();
  } catch (err) {
    log.error(`Could not convert from SVG to PNG ${err}`);
    return null;
  }
  return png;
}

const LARGE_IMAGE = 1024 * 1024;

export async function convertImageToWebp(
  session: ISession,
  image: string,
  quality = 80,
  overwrite = false,
): Promise<string | null> {
  const { size } = fs.statSync(image);
  if (size > LARGE_IMAGE) {
    const inMB = (size / (1024 * 1024)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    session.log.debug(
      `Image "${image}" is too large (${inMB} MB) to convert to webp (build will be slow).`,
    );
    throw new Error(`${inMB} MB`);
  }
  const dirname = path.dirname(image);
  const basename = path.basename(image, path.extname(image));
  const webp = path.join(dirname, `${basename}.webp`);
  if (!overwrite && fs.existsSync(webp)) {
    session.log.debug(`Image is already converted ${webp}`);
    return `${basename}.webp`;
  }
  const toc = tic();
  session.log.debug(`Optimizing image for web: ${webp}`);
  const debugLogger = {
    debug: session.log.debug,
    error: session.log.debug,
  };
  const convertImg = makeExecutable(`cwebp -q ${quality} "${image}" -o "${webp}"`, debugLogger);
  const convertGif = makeExecutable(`gif2webp -q ${quality} "${image}" -o "${webp}"`, debugLogger);

  try {
    if (path.extname(image) === '.gif') {
      if (!isGif2webpAvailable()) return null;
      await convertGif();
    } else {
      if (!isWebpAvailable()) return null;
      await convertImg();
    }
  } catch (err) {
    session.log.error(`Could not convert from image ${image} to webp:\n${err}\n`);
    return null;
  }
  session.log.debug(toc(`Optimized image for web in %s`));
  return `${basename}.webp`;
}
