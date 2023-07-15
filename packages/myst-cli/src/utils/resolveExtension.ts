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

// export function isDirectory(file: string): boolean {
//   return fs.lstatSync(file).isDirectory();
// }

export function resolveExtension(file: string): string | undefined {
  if (fs.existsSync(file) && !isDirectory(file)) return file;
  const extensions = VALID_FILE_EXTENSIONS.concat(
    VALID_FILE_EXTENSIONS.map((ext) => ext.toUpperCase()),
  );
  return extensions.map((ext) => `${file}${ext}`).find((fileExt) => fs.existsSync(fileExt));
}
