import fs from 'fs';
import { dirname } from 'path';

/** Writes a file ensuring that the directory exists */
export function writeFileToFolder(
  filename: string,
  data: string | NodeJS.ArrayBufferView,
  opts?: fs.WriteFileOptions,
) {
  if (!fs.existsSync(filename)) fs.mkdirSync(dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data, opts);
}
