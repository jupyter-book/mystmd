import fs from 'fs';
import { MyST } from 'mystjs';
import { reactiveRoles } from './roles';
import { directives } from './directives';
import { Root } from './transforms/types';
import { serverPath } from './transforms';
import { ISession } from '../session/types';

export { serverPath, publicPath } from './transforms';

export function buildPathExists(session: ISession) {
  return fs.existsSync(serverPath(session));
}

export function ensureBuildFolderExists(session: ISession) {
  if (!buildPathExists(session)) fs.mkdirSync(serverPath(session), { recursive: true });
}

export function parseMyst(content: string): Root {
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...directives },
  });
  return myst.parse(content);
}
