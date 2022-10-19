import fs from 'fs';

export function isDirectory(file: string): boolean {
  return fs.lstatSync(file).isDirectory();
}
