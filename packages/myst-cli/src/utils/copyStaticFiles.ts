import { basename, join, resolve } from 'node:path';
import fs from 'fs-extra';
import type { ISession } from '../session/types.js';

export function copyStaticFiles(
  session: ISession,
  staticFiles: string[],
  destDir: string,
  projectPath: string,
) {
  for (const fn of staticFiles) {
    const resolvedFn = resolve(projectPath, fn);
    if (!fs.existsSync(resolvedFn)) {
      session.log.warn(
        `Static file not found: "${fn}" (paths are resolved relative to the project root: ${projectPath})`,
      );
      continue;
    }
    fs.copySync(resolvedFn, join(destDir, basename(resolvedFn)));
  }
}
