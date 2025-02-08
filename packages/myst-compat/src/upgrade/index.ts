import type { IFile } from '../types/index.js';
import { upgrade as upgrade1To2 } from './version_1_2.js';

export function upgrade(src: IFile, to: string): void {
  const { version: from } = src;
  if (from === '1' && to === '2') {
    upgrade1To2(src);
    return;
  } else if (to === from) {
    return;
  } else {
    throw new Error(`Unable to upgrade between ${from} and ${to}`);
  }
}
export { upgrade1To2 };
