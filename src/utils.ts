import fs from 'fs';
import path from 'path';

/** Writes a file ensuring that the directory exists */
export function writeFileToFolder(
  filename: string | { path?: string; filename: string },
  data: string | NodeJS.ArrayBufferView,
) {
  if (typeof filename === 'string') {
    if (!fs.existsSync(filename)) fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, data);
  } else {
    writeFileToFolder(path.join(filename.path || '.', filename.filename), data);
  }
}
