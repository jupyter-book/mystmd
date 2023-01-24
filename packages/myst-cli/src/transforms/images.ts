import fs from 'fs';
import type { Root } from 'mdast';
import mime from 'mime-types';
import type { GenericNode } from 'myst-common';
import { isUrl } from 'myst-cli-utils';
import { selectAll } from 'unist-util-select';
import fetch from 'node-fetch';
import path from 'path';
import type { VFileMessage } from 'vfile-message';
import type { PageFrontmatter } from 'myst-frontmatter';
import { extFromMimeType } from 'nbtx';
import {
  addWarningForFile,
  computeHash,
  hashAndCopyStaticFile,
  imagemagick,
  inkscape,
  KNOWN_IMAGE_EXTENSIONS,
} from '../utils';
import type { ISession } from '../session/types';
import { castSession } from '../session';
import { watch } from '../store';

const DEFAULT_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

function isBase64(data: string) {
  return data.split(';base64,').length === 2;
}

function getGithubRawUrl(url?: string): string | undefined {
  const GITHUB_BLOB = /^(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)\/blob\//;
  if (!url?.match(GITHUB_BLOB)) return undefined;
  return url.replace(GITHUB_BLOB, 'https://raw.githubusercontent.com/$1/$2/');
}

/**
 * Write a base64 encoded image to a file.
 *
 * @param session: ISession - the session with logging
 * @param writeFolder: string - the folder
 * @param data: string - the base64 encoded image data
 * @param contentType: string | undefined - the mime type of the data, which if supplied will be used as fallback
 * @returns
 */
async function writeBase64(
  session: ISession,
  writeFolder: string,
  data: string,
  contentType?: string,
) {
  const [justData, header] = data.split(';base64,').reverse(); // reverse as sometimes there is no header
  const ext = extFromMimeType(header?.replace('data:', '') ?? contentType);
  const hash = computeHash(justData);
  const file = `${hash}${ext}`;
  const filePath = path.join(writeFolder, file);
  session.log.debug(`Writing binary output file ${justData.length} bytes to ${filePath}`);
  fs.writeFileSync(filePath, justData, {
    encoding: 'base64',
  });
  return file;
}

export async function downloadAndSaveImage(
  session: ISession,
  url: string,
  file: string,
  fileFolder: string,
): Promise<string | undefined> {
  const exists = fs.existsSync(fileFolder);
  const fileMatch = exists && fs.readdirSync(fileFolder).find((f) => path.parse(f).name === file);
  if (exists && fileMatch) {
    session.log.debug(`Cached image found for: ${url}...`);
    return fileMatch;
  }
  const filePath = path.join(fileFolder, file);
  session.log.debug(`Fetching image: ${url}...\n  -> saving to: ${filePath}`);
  try {
    const github = getGithubRawUrl(url);
    const res = await fetch(github ?? url);
    const contentType = res.headers.get('content-type') || '';
    const extension = mime.extension(contentType);
    if (!extension || !contentType) throw new Error('No content-type for image found.');
    if (!contentType.startsWith('image/')) {
      throw new Error(`ContentType "${contentType}" is not an image`);
    }
    if (!fs.existsSync(fileFolder)) fs.mkdirSync(fileFolder, { recursive: true });
    // Write to a file
    const fileStream = fs.createWriteStream(`${filePath}.${extension}`);
    await new Promise((resolve, reject) => {
      if (!res.body) {
        reject(`no response body from ${url}`);
      } else {
        res.body.pipe(fileStream);
        res.body.on('error', reject);
        fileStream.on('finish', resolve);
      }
    });
    await new Promise((r) => setTimeout(r, 50));
    const fileName = `${file}.${extension}`;
    session.log.debug(`Image successfully saved to: ${fileName}`);
    return fileName;
  } catch (error) {
    session.log.debug(`\n\n${(error as Error).stack}\n\n`);
    session.log.error(`Error saving image "${url}": ${(error as Error).message}`);
    return undefined;
  }
}

function resolveOutputPath(file: string, writeFolder: string, altOutputFolder?: string) {
  if (altOutputFolder == null) {
    return path.join(writeFolder, file);
  }
  // If the altOutputFolder ends with "/" it is assumed to be a web path, so normal path
  // separator is ignored.
  if (altOutputFolder.endsWith('/')) {
    return `${altOutputFolder}${file}`;
  }
  return path.join(altOutputFolder, file);
}

export async function saveImageInStaticFolder(
  session: ISession,
  urlSource: string,
  sourceFile: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string; position?: VFileMessage['position'] },
): Promise<{ urlSource: string; url: string } | null> {
  const sourceFileFolder = path.dirname(sourceFile);
  const imageLocalFile = path.join(sourceFileFolder, urlSource);
  let file: string | undefined;
  if (isUrl(urlSource)) {
    // If not oxa, download the URL directly and save it to a file with a hashed name
    file = await downloadAndSaveImage(session, urlSource, computeHash(urlSource), writeFolder);
  } else if (fs.existsSync(imageLocalFile)) {
    // Non-oxa, non-url local image paths relative to the config.section.path
    if (path.resolve(path.dirname(imageLocalFile)) === path.resolve(writeFolder)) {
      // If file is already in write folder, don't hash/copy
      file = path.basename(imageLocalFile);
    } else {
      file = hashAndCopyStaticFile(session, imageLocalFile, writeFolder);
    }
    if (!file) return null;
  } else if (isBase64(urlSource)) {
    // Handle inline base64 images
    file = await writeBase64(session, writeFolder, urlSource);
    // TODO: remove these images from the canonical-url somehow!
    // We actually want to make the package smaller, so we should remove the sourceUrl from here
    // This might have to be a transform
  } else {
    const message = `Cannot find image "${urlSource}" in ${sourceFileFolder}`;
    addWarningForFile(session, sourceFile, message, 'error', { position: opts?.position });
    return null;
  }
  // Update mdast with new file name
  const url = resolveOutputPath(file as string, writeFolder, opts?.altOutputFolder);
  return { urlSource, url };
}

export async function transformImages(
  session: ISession,
  mdast: Root,
  file: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string },
) {
  const images = selectAll('image', mdast) as GenericNode[];
  return Promise.all(
    images.map(async (image) => {
      // If image URL starts with #, replace this node with embed node
      if (image.url.startsWith('#')) {
        image.type = 'embed';
        image.label = image.url.substring(1);
        image['remove-input'] = true;
        delete image.url;
        return;
      }
      // Look up the image paths by known extensions if it is not provided
      const imagePath = path.join(path.dirname(file), image.url);
      if (!fs.existsSync(imagePath)) {
        const extension = KNOWN_IMAGE_EXTENSIONS.find((ext) => fs.existsSync(imagePath + ext));
        if (extension) {
          image.url = image.url + extension;
          image.urlSource = image.url;
        }
      }
      const result = await saveImageInStaticFolder(
        session,
        image.urlSource || image.url,
        file,
        writeFolder,
        {
          altOutputFolder: opts?.altOutputFolder,
          position: image.position,
        },
      );
      if (result) {
        // Update mdast with new file name
        const { urlSource, url } = result;
        image.urlSource = urlSource;
        image.url = url;
      }
    }),
  );
}

type ConversionFn = (session: ISession, svg: string, writeFolder: string) => Promise<string | null>;

export async function transformImageFormats(
  session: ISession,
  mdast: Root,
  file: string,
  writeFolder: string,
  opts?: { altOutputFolder?: string; imageExtensions?: string[] },
) {
  const images = selectAll('image', mdast) as GenericNode[];
  // Ignore all images with supported extension types
  const validExts = opts?.imageExtensions ?? DEFAULT_IMAGE_EXTENSIONS;
  const unsupportedImages = images.filter((image) => {
    return !validExts.includes(path.extname(image.url));
  });
  if (unsupportedImages.length === 0) return;

  // Gather unsupported SVG & GIF images that may be converted to supported types
  const svgImages: GenericNode[] = [];
  const gifImages: GenericNode[] = [];
  const unconvertableImages: GenericNode[] = [];

  const allowConvertedSvg = validExts.includes('.png') || validExts.includes('.pdf');
  const allowConvertedGif = validExts.includes('.png');

  unsupportedImages.forEach((image) => {
    if (allowConvertedSvg && path.extname(image.url) === '.svg') {
      svgImages.push(image);
    } else if (allowConvertedGif && path.extname(image.url) == '.gif') {
      gifImages.push(image);
    } else {
      unconvertableImages.push(image);
    }
  });

  const conversionPromises: Promise<void>[] = [];
  const convert = async (image: GenericNode, conversionFn: ConversionFn) => {
    const inputFile = path.join(writeFolder, path.basename(image.url));
    const outputFile = await conversionFn(session, inputFile, writeFolder);
    if (outputFile) {
      // Update mdast with new file name
      image.url = resolveOutputPath(outputFile, writeFolder, opts?.altOutputFolder);
      session.log.debug(`Successfully converted ${inputFile} -> ${image.url}`);
    } else {
      session.log.debug(`Failed to convert ${inputFile}`);
    }
  };

  const inkscapeAvailable = inkscape.isInkscapeAvailable();
  const imagemagickAvailable = imagemagick.isImageMagickAvailable();

  // Convert SVGs
  let svgConversionFn: ConversionFn | undefined;
  if (svgImages.length) {
    // Decide if we convert to PDF or PNG
    const pngIndex = validExts.indexOf('.png');
    const pdfIndex = validExts.indexOf('.pdf');
    const svgToPdf = pdfIndex !== -1 && (pngIndex === -1 || pdfIndex < pngIndex);
    const svgToPng = !svgToPdf || !inkscapeAvailable;
    const logPrefix = `🌠 Converting ${svgImages.length} SVG image${
      svgImages.length > 1 ? 's' : ''
    } to`;
    if (svgToPdf && inkscapeAvailable) {
      session.log.info(`${logPrefix} PDF using inkscape`);
      svgConversionFn = inkscape.convertSvgToPdf;
    } else if (svgToPng && inkscapeAvailable) {
      session.log.info(`${logPrefix} PNG using inkscape`);
      svgConversionFn = inkscape.convertSvgToPng;
    } else if (svgToPng && imagemagickAvailable) {
      if (svgToPdf) {
        addWarningForFile(
          session,
          file,
          'To convert SVG images to PDF, you must install inkscape.',
          'warn',
          { note: 'Images converted to PNG as a fallback using imagemagick.' },
        );
      }
      session.log.info(`${logPrefix} PNG using imagemagick`);
      svgConversionFn = imagemagick.convertSvgToPng;
    } else {
      addWarningForFile(
        session,
        file,
        'Cannot convert SVG images, they may not correctly render.',
        'error',
        { note: 'To convert these images, you must install imagemagick or inkscape' },
      );
    }
    if (svgConversionFn) {
      conversionPromises.push(
        ...svgImages.map(async (image) => await convert(image, svgConversionFn as ConversionFn)),
      );
    }
  }

  // Convert GIFs
  let gifConversionFn: ConversionFn | undefined;
  if (gifImages.length) {
    if (imagemagickAvailable) {
      session.log.info(
        `🌠 Converting ${gifImages.length} GIF image${
          gifImages.length > 1 ? 's' : ''
        } to PNG using imagemagick`,
      );
      gifConversionFn = imagemagick.extractFirstFrameOfGif;
    } else {
      addWarningForFile(
        session,
        file,
        'Cannot convert GIF images, they may not correctly render.',
        'error',
        { note: 'To convert these images, you must install imagemagick' },
      );
    }
    if (gifConversionFn) {
      conversionPromises.push(
        ...gifImages.map(async (image) => await convert(image, gifConversionFn as ConversionFn)),
      );
    }
  }

  // Warn on unsupported, unconvertable images
  if (unconvertableImages.length) {
    unconvertableImages.forEach((image) => {
      const badExt = path.extname(image.url) || '<no extension>';
      addWarningForFile(
        session,
        file,
        `Unsupported image extension "${badExt}" may not correctly render.`,
        'error',
        { position: image.position },
      );
    });
  }
  return Promise.all(conversionPromises);
}

export async function transformThumbnail(
  session: ISession,
  mdast: Root,
  file: string,
  frontmatter: PageFrontmatter,
  writeFolder: string,
  opts?: { altOutputFolder?: string },
) {
  let thumbnail = frontmatter.thumbnail;
  // If the thumbnail is explicitly null, don't add an image
  if (thumbnail === null) {
    session.log.debug(`${file}#frontmatter.thumbnail is explicitly null, not searching content.`);
    return;
  }
  if (!thumbnail) {
    // The thumbnail isn't found, grab it from the mdast
    const [image] = selectAll('image', mdast) as GenericNode[];
    if (!image) {
      session.log.debug(`${file}#frontmatter.thumbnail is not set, and there are no images.`);
      return;
    }
    session.log.debug(`${file}#frontmatter.thumbnail is being populated by the first image.`);
    thumbnail = image.urlSource || image.url;
  }
  if (!thumbnail) return;
  session.log.debug(`${file}#frontmatter.thumbnail Saving thumbnail in static folder.`);
  const result = await saveImageInStaticFolder(session, thumbnail, file, writeFolder, {
    altOutputFolder: opts?.altOutputFolder,
  });
  if (result) {
    // Update frontmatter with new file name
    const { url } = result;
    frontmatter.thumbnail = url;
  }
}

export async function transformWebp(
  session: ISession,
  opts: { file: string; imageWriteFolder: string },
) {
  const { file, imageWriteFolder } = opts;
  const cache = castSession(session);
  const postData = cache.$mdast[opts.file].post;
  if (!postData) throw new Error(`Expected mdast to be processed and transformed for ${file}`);
  const { mdast, frontmatter } = postData;
  const writeFolderContents = fs.readdirSync(imageWriteFolder);
  const images = selectAll('image', mdast) as GenericNode[];
  await Promise.all(
    images.map(async (image) => {
      if (!image.url) return;
      const fileMatch = writeFolderContents.find((item) => image.url.endsWith(item));
      if (!fileMatch) return;
      try {
        const result = await imagemagick.convertImageToWebp(
          session,
          path.join(imageWriteFolder, fileMatch),
        );
        if (result) image.urlOptimized = image.url.replace(fileMatch, result);
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
    }),
  );

  if (frontmatter.thumbnail) {
    const fileMatch = writeFolderContents.find((item) => frontmatter.thumbnail?.endsWith(item));
    if (fileMatch) {
      try {
        const result = await imagemagick.convertImageToWebp(
          session,
          path.join(imageWriteFolder, fileMatch),
        );
        if (result) {
          frontmatter.thumbnailOptimized = frontmatter.thumbnail.replace(fileMatch, result);
          session.store.dispatch(
            watch.actions.updateFileInfo({
              path: file,
              thumbnailOptimized: frontmatter.thumbnailOptimized,
            }),
          );
        }
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
    }
  }
  cache.$mdast[file].post = { ...postData, mdast, frontmatter };
}
