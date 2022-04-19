import fs from 'fs';
import path from 'path';
import { MyST } from 'mystjs';
import { Options } from './types';
import { reactiveRoles } from './roles';
import { directives } from './directives';

export function serverPath(opts: Options) {
  const buildPath = opts.buildPath || '_build';
  return `${buildPath}/web`;
}

export function publicPath(opts: Options) {
  return path.join(serverPath(opts), 'public');
}

export function exists(opts: Options) {
  return fs.existsSync(serverPath(opts));
}

export function ensureBuildFolderExists(opts: Options) {
  if (!exists(opts)) fs.mkdirSync(serverPath(opts), { recursive: true });
}

export function parseMyst(content: string) {
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...directives },
  });
  return myst.parse(content);
}
