import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ISession } from '../session';

export function createTempFolder(session?: ISession) {
  if (!session) return fs.mkdtempSync(path.join(os.tmpdir(), 'myst'));
  const tempLocation = path.join(session.buildPath(), 'temp');
  fs.mkdirSync(tempLocation, { recursive: true });
  return fs.mkdtempSync(path.join(tempLocation, 'myst'));
}
