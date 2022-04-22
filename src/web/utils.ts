import fs from 'fs';
import { MyST } from 'mystjs';
import { Options } from './types';
import { reactiveRoles } from './roles';
import { directives } from './directives';
import { Root } from './transforms/types';
import { serverPath } from './transforms';

export { serverPath, publicPath } from './transforms';

export function exists(opts: Options) {
  return fs.existsSync(serverPath(opts));
}

export function ensureBuildFolderExists(opts: Options) {
  if (!exists(opts)) fs.mkdirSync(serverPath(opts), { recursive: true });
}

export function parseMyst(content: string): Root {
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...directives },
  });
  return myst.parse(content);
}
