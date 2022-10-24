import fs from 'fs';
import path from 'path';
import os from 'os';

export function createTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'myst'));
}
