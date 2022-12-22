import fs from 'fs';
import path from 'path';
import { isDirectory } from './isDirectory';

export const VALID_FILE_EXTENSIONS = ['.md', '.ipynb', '.tex'];
export const KNOWN_IMAGE_EXTENSIONS = [
  '.png',
  '.tiff',
  '.jpg',
  'jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.pdf',
  '.eps',
];
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
