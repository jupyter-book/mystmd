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

export const VALID_FILE_EXTENSIONS = ['.md', '.ipynb', '.tex', '.myst.json'];
export const KNOWN_FAST_BUILDS = new Set(['.ipynb', '.md', '.tex', '.myst.json']);

/** Return true if file has a valid extension for MyST content */
export function isValidFile(file: string): boolean {
  const lowerCasePath = file.toLowerCase();
  return VALID_FILE_EXTENSIONS.some((ext) => lowerCasePath.endsWith(ext));
}

/**
 * Parse a file path into its constituent parts
 *
 * Handles multi-dot extensions
 */
export function parseFilePath(file: string): {
  dir: string;
  name: string;
  ext: string;
} {
  const { dir, base, ext: baseExt, name: baseName } = path.parse(file);
  for (const ext of VALID_FILE_EXTENSIONS) {
    if (base.endsWith(ext)) {
      const name = base.slice(0, base.length - ext.length);
      return { dir, name, ext };
    }
  }
  return { dir, name: baseName, ext: baseExt };
}

/**
 * Given a file with resolved path and filename, match to md, ipynb, or tex files
 *
 * If the file already has an extension and exists, it is returned as is.
 * If the file with any of the extensions .md, .ipynb, .myst.json, or .tex appended exists,
 * the existing file is returned.
 *
 * This will log an error if no match is found or multiple valid matches are found.
 * (In the latter case, the first match is still returned.)
 * This will log a warning if the given file did not have an extension and required resolution.
 *
 */
export function resolveExtension(
  file: string,
  warnFn?: (message: string, level: 'warn' | 'error', note?: string) => void,
): string | undefined {
  if (fs.existsSync(file)) {
    if (!isDirectory(file)) return file;
    if (warnFn) {
      warnFn(
        `Folder referenced as file in table of contents: ${file}`,
        'error',
        `To add all contents of a folder, you may use "pattern: ${file}/**" in your toc`,
      );
      return;
    }
  }
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
      // Need a different warning if this is a folder
      warnFn(
        `Unable to resolve table of contents entry: ${file}`,
        'error',
        `Expected one of:\n     - ${VALID_FILE_EXTENSIONS.map((ext) => `${file}${ext}`).join('\n     - ')}`,
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
