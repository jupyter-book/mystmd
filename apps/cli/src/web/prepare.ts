import fs from 'fs';
import { join } from 'path';
import type { ISession } from '../session/types';
import { publicPath, serverPath, tic } from '../utils';
import { processSite } from '../store/local/actions';

export type Options = {
  clean?: boolean;
  force?: boolean;
  strict?: boolean;
  checkLinks?: boolean;
  branch?: string;
  ci?: boolean;
  yes?: boolean;
  writeToc?: boolean;
  keepHost?: boolean;
};

export function cleanBuiltFiles(session: ISession, info = true): void {
  const toc = tic();
  fs.rmSync(join(serverPath(session), 'app', 'content'), { recursive: true, force: true });
  fs.rmSync(join(publicPath(session), '_static'), { recursive: true, force: true });
  const log = info ? session.log.info : session.log.debug;
  log(toc('🧹 Clean build files in %s.'));
}

export function ensureBuildFoldersExist(session: ISession): void {
  session.log.debug('Build folders created for `app/content` and `_static`.');
  fs.mkdirSync(join(serverPath(session), 'app', 'content'), { recursive: true });
  fs.mkdirSync(join(publicPath(session), '_static'), { recursive: true });
}

export async function buildSite(session: ISession, opts: Options): Promise<boolean> {
  const { writeToc, force, clean } = opts;
  if (force || clean) cleanBuiltFiles(session);
  ensureBuildFoldersExist(session);
  return processSite(session, { writeToc, strict: opts.strict, checkLinks: opts.checkLinks });
}
