import { basename, join } from 'node:path';
import fs from 'fs-extra';
import type { ISession } from '../session/types.js';

export function copyStaticFiles(
  session: ISession,
  staticFiles: string[],
  destDir: string,
  projectPath: string,
) {
  for (const fn of staticFiles) {
    if (!fs.existsSync(fn)) {
      session.log.warn(
        `Static file not found: "${fn}" (paths are resolved relative to the project root: ${projectPath})`,
      );
      continue;
    }
    fs.copySync(fn, join(destDir, basename(fn)));
  }
}
