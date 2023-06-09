import fs from 'node:fs';

export function isDirectory(file: string): boolean {
  return fs.lstatSync(file).isDirectory();
}
