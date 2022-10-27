import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ISession } from '../session';

export function createTempFolder(session?: ISession) {
  if (!session) return fs.mkdtempSync(path.join(os.tmpdir(), 'myst'));
  return fs.mkdtempSync(path.join(session.buildPath(), 'temp', 'myst'));
}
