import fs from 'fs';
import type { ISession } from '../session/types';
import { tic } from 'myst-cli-utils';
import { processSite } from '../store/local/actions';

export type Options = {
  clean?: boolean;
  force?: boolean;
  strict?: boolean;
  headless?: boolean;
  checkLinks?: boolean;
  branch?: string;
  ci?: boolean;
  yes?: boolean;
  writeToc?: boolean;
  keepHost?: boolean;
};

export function cleanBuiltContent(session: ISession, info = true): void {
  const toc = tic();
  fs.rmSync(session.sitePath(), { recursive: true, force: true });
  const log = info ? session.log.info : session.log.debug;
  log(toc('🧹 Clean build content in %s.'));
}

export function ensureBuildFoldersExist(session: ISession): void {
  session.log.debug('Build folders created for `content` and `_static`.');
  // This also creates the site directory!
  fs.mkdirSync(session.contentPath(), { recursive: true });
  fs.mkdirSync(session.staticPath(), { recursive: true });
}

export async function buildSite(session: ISession, opts: Options): Promise<boolean> {
  const { writeToc, force, clean } = opts;
  if (force || clean) cleanBuiltContent(session);
  ensureBuildFoldersExist(session);
  return processSite(session, { writeToc, strict: opts.strict, checkLinks: opts.checkLinks });
}
