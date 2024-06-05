import fs from 'node:fs';
import path from 'node:path';
import { isDirectory } from 'myst-cli-utils';

export enum ImageExtensions {
  png = '.png',
  jpg = '.jpg',
  jpeg = '.jpeg',
  svg = '.svg',
  gif = '.gif',
  tiff = '.tiff',
  tif = '.tif',
  pdf = '.pdf',
  eps = '.eps',
  webp = '.webp',
  mp4 = '.mp4', // A moving image!
}
export const KNOWN_IMAGE_EXTENSIONS = Object.values(ImageExtensions);
export const VALID_FILE_EXTENSIONS = ['.md', '.ipynb', '.tex'];
export const KNOWN_FAST_BUILDS = new Set(['.ipynb', '.md', '.tex']);

export function isValidFile(file: string): boolean {
  return VALID_FILE_EXTENSIONS.includes(path.extname(file).toLowerCase());
}

export function resolveExtension(
  file: string,
  warnFn?: (message: string, level: 'warn' | 'error', note?: string) => void,
): string | undefined {
  if (fs.existsSync(file) && !isDirectory(file)) return file;
  const extensions = VALID_FILE_EXTENSIONS.concat(
    VALID_FILE_EXTENSIONS.map((ext) => ext.toUpperCase()),
  );
  const matches = extensions
    .map((ext) => `${file}${ext}`)
    .filter((fileExt) => fs.existsSync(fileExt));
  if (warnFn) {
    const normalizedMatches: string[] = [];
    matches.forEach((match) => {
      if (!normalizedMatches.map((m) => m.toLowerCase()).includes(match.toLowerCase())) {
        normalizedMatches.push(match);
      }
    });
    if (normalizedMatches.length === 0 && path.extname(file)) {
      warnFn(`Table of contents entry does not exist: ${file}`, 'error');
    } else if (normalizedMatches.length === 0) {
      warnFn(
        `Unable to resolve table of contents entry: ${file}`,
        'error',
        `Expected one of:\n     - ${VALID_FILE_EXTENSIONS.map((ext) => `${file}${ext}`).join('\n- ')}`,
      );
    } else if (normalizedMatches.length === 1) {
      warnFn(
        `Extension inferred for table of contents entry: ${file}`,
        'warn',
        `To ensure consistent behavior, update the toc entry to ${matches[0]}`,
      );
    } else {
      warnFn(
        `Multiple files match table of contents entry: ${file}`,
        'error',
        `Valid files include: ${normalizedMatches[0]} (currently used in the build), ${normalizedMatches.slice(1).join(', ')}\n   Update the toc entry to include the correct extension to ensure consistent behavior.`,
      );
    }
  }
  return matches[0];
}
