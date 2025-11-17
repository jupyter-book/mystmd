import type { Command } from 'commander';
import type { ISession, Session } from 'myst-cli';
import { checkNodeVersion, getNodeVersion, logVersions } from 'myst-cli';
import { chalkLogger, LogLevel } from 'myst-cli-utils';
import { Semaphore } from 'async-mutex';
import { cpus } from 'node:os';

type SessionOpts = {
  debug?: boolean;
  config?: string;
  executeParallel?: number;
};

export function clirun(
  sessionClass: typeof Session,
  func:
    | ((session: ISession, ...args: any[]) => Promise<void>)
    | ((session: ISession, ...args: any[]) => void),
  program: Command,
  runOptions?: {
    nArgs?: number;
    /**
     * Wait for all promises to finish, even if the main command is complete.
     *
     * For example, when starting a watch process.
     * For build commands, this should be `false`, the default, to ensure a speedy exit from the CLI.
     */
    keepAlive?: boolean | ((...args: any[]) => boolean);
  },
) {
  return async function (this: Command, ...args: any[]) {
    // Use options from 'this' merged with parent program options
    // Needed to pass options from e.g. the build command to the session
    const opts = { ...program.opts(), ...this.opts() } as SessionOpts;
    const logger = chalkLogger(opts?.debug ? LogLevel.debug : LogLevel.info, process.cwd());
    // Override default myst.yml if --config option is given.
    const configFiles = opts?.config ? [opts.config] : null;
    const parallelCount = opts?.executeParallel ?? Math.max(1, cpus().length - 1);
    const executionSemaphore = new Semaphore(parallelCount);
    const session = new sessionClass({ logger, configFiles, executionSemaphore });
    await session.reload();
    session.log.info(`🍡 Execution parallelism set to: ${parallelCount}`);
    const versions = await getNodeVersion(session);
    logVersions(session, versions);
    const versionsInstalled = await checkNodeVersion(session);
    if (!versionsInstalled) process.exit(1);
    try {
      await func(session, ...args.slice(0, runOptions?.nArgs));
    } catch (error) {
      session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      session.log.error((error as Error).message);
      logVersions(session, versions, false);
      process.exit(1);
    }
    session.showUpgradeNotice?.();
    if (typeof runOptions?.keepAlive === 'function') {
      if (!runOptions.keepAlive(...args)) process.exit(0);
    } else if (!runOptions?.keepAlive) {
      process.exit(0);
    }
  };
}
