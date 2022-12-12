import fs from 'fs';
import path from 'path';
import { sync as which } from 'which';
import { makeExecutable, tic } from 'myst-cli-utils';
import type { ISession } from '../session/types';

export function isImageMagickAvailable() {
  return which('convert', { nothrow: true });
}

export function isWebpAvailable() {
  return which('cwebp', { nothrow: true });
}

export function isGif2webpAvailable() {
  return which('gif2webp', { nothrow: true });
}

const LARGE_IMAGE = 1024 * 1024;

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

export async function convertImageToWebp(
  session: ISession,
  image: string,
  quality = 80,
  overwrite = false,
): Promise<string | null> {
  if (!fs.existsSync(image)) {
    session.log.debug(`Image does not exist: "${image}"`);
    return null;
  }
  const imageExt = path.extname(image).toLowerCase();
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.tiff', '.gif', '.pdf'];
  if (!allowedExtensions.includes(imageExt)) {
    session.log.debug(`Skipping webp conversion of "${image}"`);
    return null;
  }

  const { size } = fs.statSync(image);
  if (size > LARGE_IMAGE && imageExt !== '.pdf') {
    const inMB = (size / (1024 * 1024)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    session.log.debug(
      `Image "${image}" is too large (${inMB} MB) to convert to webp (build will be slow).`,
    );
    return null;
  }

  const dirname = path.dirname(image);
  const basename = path.basename(image, imageExt);
  const png = path.join(dirname, `${basename}.png`);
  const webp = path.join(dirname, `${basename}.webp`);
  if (!overwrite && fs.existsSync(webp)) {
    session.log.debug(`Image is already converted ${webp}`);
    return `${basename}.webp`;
  }
  const toc = tic();
  session.log.debug(`Optimizing image for web: ${webp}`);
  const debugLogger = {
    // We cannot destructure the logger here, bunyan complains
    debug(...args: any[]) {
      session.log.debug(...args);
    },
    error(...args: any[]) {
      session.log.debug(...args);
    },
  };
  const convertImg = makeExecutable(`cwebp -q ${quality} "${image}" -o "${webp}"`, debugLogger);
  const convertGif = makeExecutable(`gif2webp -q ${quality} "${image}" -o "${webp}"`, debugLogger);
  // Density has to be BEFORE the PDF
  const convertPdfPng = makeExecutable(`convert -density 600 ${image} ${png}`, debugLogger);
  const convertPdfWebP = makeExecutable(`cwebp -q ${quality} "${png}" -o "${webp}"`, debugLogger);

  try {
    if (path.extname(image) === '.pdf') {
      if (!isImageMagickAvailable()) return null;
      await convertPdfPng();
      if (!isWebpAvailable()) return null;
      await convertPdfWebP();
    } else if (path.extname(image) === '.gif') {
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
