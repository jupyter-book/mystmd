import type { IFile } from '../types/index.js';
import { downgrade as downgrade2To1 } from './version_2_1.js';

export function downgrade(src: IFile, to: string): void {
  const { version: from } = src;
  if (to === '1' && from === '2') {
    downgrade2To1(src);
    return;
  } else if (to === from) {
    return;
  } else {
    throw new Error(`Unable to downgrade between ${from} and ${to}`);
  }
}

export { downgrade2To1 };
