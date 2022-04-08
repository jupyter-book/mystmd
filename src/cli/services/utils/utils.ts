import fs from 'fs';
import { Command } from 'commander';
import check from 'check-node-version';
import chalk from 'chalk';
import { chalkLogger, LogLevel } from '../../../logging';
import { Session, getToken } from '../../../session';
import { ISession } from '../../../session/types';
import { CURVENOTE_YML } from '../../../config';

const INSTALL_NODE_MESSAGE = `
You can download Node here:

${chalk.bold('https://nodejs.org/en/download/')}

You can upgrade your NPM version using:

${chalk.bold('npm install -g npm@latest')}
`;

async function checkNodeVersion(session: ISession): Promise<boolean> {
  const checking = new Promise<boolean>((resolve) => {
    check({ node: '>= 14.0.0 <17.0.0', npm: '>7' }, (error, result) => {
      if (error) {
        session.log.error(error);
        return;
      }
      if (result.isSatisfied) {
        resolve(true);
        return;
      }
      const unsatisfied = Object.keys(result.versions)
        .filter((packageName) => !result.versions[packageName].isSatisfied)
        .map((packageName) => {
          const p = result.versions[packageName];
          const version = p.version ? `Found: ${p.version}` : 'Package Not Found';
          const wanted = `Required: ${p.wanted?.raw || ''}`;
          return `${packageName}\t${version}\t${wanted}`;
        });
      session.log.error(`Please update your Node or NPM versions.\n\n${unsatisfied.join('\n')}`);
      session.log.info(INSTALL_NODE_MESSAGE);
      resolve(false);
    });
  });
  return checking;
}

type SessionOpts = {
  debug?: boolean | string;
  config?: string;
};

function getLogLevel(level: LogLevel | boolean | string = LogLevel.info): LogLevel {
  if (typeof level === 'number') return level;
  const useLevel: LogLevel = level ? LogLevel.debug : LogLevel.info;
  return useLevel;
}

export function anonSession(opts?: SessionOpts): ISession {
  const logger = chalkLogger(getLogLevel(opts?.debug));
  const session = new Session(undefined, { logger });
  return session;
}

function getSession(opts?: SessionOpts & { hideNoTokenWarning?: boolean }): ISession {
  const logger = chalkLogger(getLogLevel(opts?.debug));
  const token = getToken(logger);
  if (!token && !opts?.hideNoTokenWarning) {
    logger.warn('No token was found in settings or CURVENOTE_TOKEN. Session is not authenticated.');
    logger.info('You can set a token with:');
    logger.info('curvenote token set API_TOKEN');
  }
  let session;
  try {
    session = new Session(token, { logger });
  } catch (error) {
    logger.error((error as Error).message);
    logger.info('You can remove your token using:');
    logger.info('curvenote token remove');
    process.exit(1);
  }
  return session;
}

export function clirun(
  func:
    | ((session: ISession, ...args: any[]) => Promise<void>)
    | ((session: ISession, ...args: any[]) => void),
  cli: {
    program: Command;
    session?: ISession;
    requireConfig?: boolean;
    hideNoTokenWarning?: boolean;
  },
) {
  return async (...args: any[]) => {
    const opts = cli.program.opts() as SessionOpts;
    const useSession =
      cli.session ?? getSession({ ...opts, hideNoTokenWarning: cli.hideNoTokenWarning });
    const versionsInstalled = await checkNodeVersion(useSession);
    if (!versionsInstalled) process.exit(1);
    if (cli.requireConfig && !useSession.config) {
      useSession.log.error(
        `You must be in a directory with a ${CURVENOTE_YML}\n\nDo you need to run: curvenote init`,
      );
      process.exit(1);
    }
    try {
      await func(useSession, ...args);
    } catch (error) {
      if (opts.debug === true) {
        useSession.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      } else if (opts.debug) {
        fs.writeFileSync(opts.debug, (error as Error)?.stack ?? '');
      }
      useSession.log.error((error as Error).message);
      process.exit(1);
    }
  };
}
