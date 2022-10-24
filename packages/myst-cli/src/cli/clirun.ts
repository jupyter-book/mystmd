import type { Command } from 'commander';
import type { ISession } from '../session/types';
import type { Session } from '../session';
import { checkNodeVersion, getNodeVersion, logVersions } from '../utils';

type SessionOpts = {
  debug?: boolean;
};

export function clirun(
  sessionClass: typeof Session,
  func:
    | ((session: ISession, ...args: any[]) => Promise<void>)
    | ((session: ISession, ...args: any[]) => void),
  program: Command,
  nArgs?: number,
) {
  return async (...args: any[]) => {
    const opts = program.opts() as SessionOpts;
    const session = new sessionClass();
    const versions = await getNodeVersion(session);
    logVersions(session, versions);
    const versionsInstalled = await checkNodeVersion(session);
    if (!versionsInstalled) process.exit(1);
    try {
      await func(session, ...args.slice(0, nArgs));
    } catch (error) {
      if (opts.debug) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
      session.log.error((error as Error).message);
      logVersions(session, versions, false);
      process.exit(1);
    }
  };
}
