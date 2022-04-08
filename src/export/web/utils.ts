import fs from 'fs';
import path from 'path';
import { MyST } from 'mystjs';
import { Options } from './types';
import { reactiveRoles } from './roles';
import { reactiveDirectives } from './directives';

export function serverPath(opts: Options) {
  const buildPath = opts.buildPath || '_build';
  return `${buildPath}/web`;
}

export function exists(opts: Options) {
  return fs.existsSync(serverPath(opts));
}

export function ensureBuildFolderExists(opts: Options) {
  if (!exists(opts)) fs.mkdirSync(serverPath(opts), { recursive: true });
}

export function writeFileToFolder(filename: string, data: string | NodeJS.ArrayBufferView) {
  if (!fs.existsSync(filename)) fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data);
}

export function parseMyst(content: string) {
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...reactiveDirectives },
  });
  return myst.parse(content);
}
