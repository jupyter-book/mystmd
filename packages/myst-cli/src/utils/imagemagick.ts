import fs from 'node:fs';
import path from 'node:path';
import which from 'which';
import type { LoggerDE } from 'myst-cli-utils';
import { makeExecutable, tic } from 'myst-cli-utils';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import { addWarningForFile } from './addWarningForFile.js';

function magickCommandAvailable(): boolean {
  return !!which.sync('magick', { nothrow: true });
}

function convertCommandAvailable(): boolean {
  return !!which.sync('convert', { nothrow: true });
}

export function isImageMagickAvailable() {
  return magickCommandAvailable() || convertCommandAvailable();
}

export function imageMagickCommand() {
  if (!magickCommandAvailable() && convertCommandAvailable()) {
    return 'convert';
  }
  return 'magick';
}

export function isWebpAvailable(): boolean {
  return !!which.sync('cwebp', { nothrow: true });
}

export function isDwebpAvailable(): boolean {
  return !!which.sync('dwebp', { nothrow: true });
}

export function isGif2webpAvailable(): boolean {
  return !!which.sync('gif2webp', { nothrow: true });
}

const LARGE_IMAGE = 1024 * 1024 * 1.5;

function createImagemagikLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      if (!line) return;
      session.log.debug(data);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      const lower = line.toLowerCase();
      // There are a lot of deprecation warnings that we want to hide to myst users
      if (lower.includes('tiffwarnings/951')) {
        session.log.debug(line);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}

export async function extractFirstFrameOfGif(session: ISession, gif: string, writeFolder: string) {
  if (!fs.existsSync(gif)) return null;
  const { name, ext } = path.parse(gif);
  if (ext !== '.gif') return null;
  const pngFile = `${name}.png`;
  const png = path.join(writeFolder, pngFile);
  if (fs.existsSync(png)) {
    session.log.debug(`Cached file found for extracted GIF: ${gif}`);
    return pngFile;
  }
  const executable = `${imageMagickCommand()} -density 600 -colorspace RGB ${gif}[0] ${png}`;
  session.log.debug(`Executing: ${executable}`);
  const exec = makeExecutable(executable, session.log);
  try {
    await exec();
  } catch (err) {
    addWarningForFile(
      session,
      gif,
      `Could not extract an image from gif: ${gif} - ${err}`,
      'error',
      {
        ruleId: RuleId.imageFormatConverts,
      },
    );
    return null;
  }
  return pngFile;
}

/**
 * webp -> png using dwebp
 */
export async function convertWebpToPng(session: ISession, source: string, writeFolder: string) {
  if (!fs.existsSync(source)) return null;
  const { name, ext } = path.parse(source);
  if (ext !== '.webp') return null;
  const pngFile = `${name}.png`;
  const png = path.join(writeFolder, pngFile);
  if (fs.existsSync(png)) {
    session.log.debug(`Cached file found for converted PNG: ${source}`);
    return pngFile;
  }
  const debugLogger = {
    // We cannot destructure the logger here, bunyan complains
    debug(...args: any[]) {
      session.log.debug(...args);
    },
    error(...args: any[]) {
      session.log.debug(...args);
    },
  };
  const exec = makeExecutable(`dwebp "${source}" -o "${png}"`, debugLogger);
  try {
    await exec();
  } catch (err) {
    addWarningForFile(
      session,
      source,
      `Could not extract a PNG from WEBP: ${source} - ${err}`,
      'error',
      {
        ruleId: RuleId.imageFormatConverts,
      },
    );
    return null;
  }
  return pngFile;
}

export async function convert(
  inputExtension: string,
  outputExtension: string,
  session: ISession,
  input: string,
  writeFolder: string,
  options?: { trim?: boolean; page?: number },
) {
  if (!fs.existsSync(input)) return null;
  const { name, ext } = path.parse(input);
  if (ext !== inputExtension) return null;
  const filename = `${name}${options?.page ? '-' + options.page : ''}${outputExtension}`;
  const output = path.join(writeFolder, filename);
  const inputFormatUpper = inputExtension.slice(1).toUpperCase();
  const outputFormatUpper = outputExtension.slice(1).toUpperCase();
  if (fs.existsSync(output)) {
    session.log.debug(`Cached file found for converted ${inputFormatUpper}: ${input}`);
    return filename;
  } else {
    const executable = `${imageMagickCommand()} -density 600 -colorspace RGB ${input}${options?.page ? '[' + options.page + ']' : ''}${
      options?.trim ? ' -trim' : ''
    } ${output}`;

    session.log.debug(`Executing: ${executable}`);
    const exec = makeExecutable(executable, createImagemagikLogger(session));
    try {
      await exec();
    } catch (err) {
      addWarningForFile(
        session,
        input,
        `Could not convert from ${inputFormatUpper} to ${outputFormatUpper}: ${input} - ${err}`,
        'error',
        {
          ruleId: RuleId.imageFormatConverts,
        },
      );
      return null;
    }
    if (fs.existsSync(output)) return filename;
    // Convert occasionally creates a few outputs (e.g. for layers etc.)
    const maybeNumbered = output.replace(
      new RegExp(`\\${outputExtension}$`),
      `-0${outputExtension}`,
    );
    if (fs.existsSync(maybeNumbered)) {
      fs.renameSync(maybeNumbered, output);
      // TODO: delete the other outputs? (e.g. -1.png, -2.png, etc.)
      return filename;
    }
  }
  return null;
}

export async function convertImageToWebp(
  session: ISession,
  image: string,
  {
    quality = 80,
    overwrite = false,
    maxSize = LARGE_IMAGE,
  }: { quality?: number; overwrite?: boolean; maxSize?: number },
): Promise<string | null> {
  if (!fs.existsSync(image)) {
    // If the image does not exist, it will be caught elsewhere prior to webp conversion
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
  // PDF and TIFF are not image formats that can be used in most web-browsers
  if (size > maxSize && !(imageExt === '.pdf' || imageExt === '.tiff')) {
    const inMB = (size / (1024 * 1024)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    addWarningForFile(
      session,
      image,
      `Image is too large (${inMB} MB) to convert to webp (build will be slow).`,
      (isGif2webpAvailable() && imageExt === '.gif') || isWebpAvailable() ? 'warn' : 'debug',
      { ruleId: RuleId.imageFormatOptimizes },
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
  const convertPdfPng = makeExecutable(
    `${imageMagickCommand()} -density 600 -colorspace RGB ${image} -trim ${png}`,
    debugLogger,
  );
  const convertPdfWebP = makeExecutable(`cwebp -q ${quality} "${png}" -o "${webp}"`, debugLogger);

  try {
    if (path.extname(image) === '.pdf') {
      if (!isImageMagickAvailable() || !isWebpAvailable()) {
        addWarningForFile(
          session,
          image,
          `Could not convert from image ${image} to webp:\nimagemagick and cwebp are required\n`,
          'warn',
          { ruleId: RuleId.imageFormatOptimizes },
        );
        return null;
      }
      await convertPdfPng();
      await convertPdfWebP();
    } else if (path.extname(image) === '.gif') {
      if (!isGif2webpAvailable()) {
        addWarningForFile(
          session,
          image,
          `Could not convert from image ${image} to webp:\ngif2webp is required\n`,
          'debug',
          { ruleId: RuleId.imageFormatOptimizes },
        );
        return null;
      }
      await convertGif();
    } else {
      if (!isWebpAvailable()) {
        addWarningForFile(
          session,
          image,
          `Could not convert from image ${image} to webp:\ncwebp is required\n`,
          'debug',
          { ruleId: RuleId.imageFormatOptimizes },
        );
        return null;
      }
      await convertImg();
    }
  } catch (err) {
    addWarningForFile(session, image, `Could not convert to webp:\n${err}\n`, 'warn', {
      ruleId: RuleId.imageFormatOptimizes,
    });
    return null;
  }
  session.log.debug(toc(`Optimized image for web in %s`));
  return `${basename}.webp`;
}
