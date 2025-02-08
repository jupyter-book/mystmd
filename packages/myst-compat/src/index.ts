import { downgrade } from './downgrade/index.js';
import { upgrade } from './upgrade/index.js';
import type { IFile } from './types/index.js';

export function makeCompatible(src: IFile, to: string) {
  const { version: from } = src;
  const fromVersion = parseInt(from);
  const toVersion = parseInt(to);

  if (fromVersion === toVersion) {
    return;
  } else if (fromVersion < toVersion) {
    upgrade(src, to);
    return;
  } else {
    downgrade(src, to);
    return;
  }
}

export { downgrade, upgrade };
