import fs from 'fs';
import chalk from 'chalk';
import type check from 'check-node-version';
import type { Command } from 'commander';
import { getNodeVersion, selectors, version as mystCliVersion } from 'myst-cli';
import { chalkLogger, LogLevel } from 'myst-cli-utils';
import { Session, getToken } from '../session';
import type { ISession } from '../session/types';
import CurvenoteVersion from '../version';
import { docLinks } from '../docs';

const INSTALL_NODE_MESSAGE = `
You can download Node here:

${chalk.bold('https://nodejs.org/en/download/')}

Upgrade your Node Package Manager (npm) using:

${chalk.bold('npm install -g npm@latest')}

Additional Documentation:

${chalk.bold.blue(docLinks.installNode)}
`;

type VersionResults = Parameters<Parameters<typeof check>[1]>[1];

function logVersions(session: ISession, result: VersionResults | null, debug = true) {
  const versions: string[][] = [];
  Object.entries(result?.versions ?? {}).forEach(([name, p]) => {
    versions.push([
      name,
      p.version ? `${p.version}` : 'Package Not Found',
      `Required: ${p.wanted?.raw || ''}`,
      p.isSatisfied ? '✅' : '⚠️',
    ]);
  });
  versions.push(['myst-cli', mystCliVersion]);
  versions.push(['curvenote', CurvenoteVersion]);
  try {
    // TODO: Improve this to tell you more about themes
    const packageJson = JSON.parse(fs.readFileSync(session.webPackageJsonPath()).toString()) as {
      name: string;
      version: string;
    };
    if (packageJson.name && packageJson.version) {
      versions.push([packageJson.name, packageJson.version]);
    }
  } catch (error) {
    // pass
  }
  const versionString = versions
    .map(
      ([n, v, r, c]) =>
        `\n - ${n.padEnd(25, ' ')}${v.padStart(10, ' ').padEnd(15, ' ')}${r?.padEnd(25) ?? ''}${
          c ?? ''
        }`,
    )
    .join('');
  session.log[debug ? 'debug' : 'info'](`\n\nCurvenote CLI Versions:${versionString}\n\n`);
}

async function checkNodeVersion(session: ISession): Promise<boolean> {
  const result = await getNodeVersion(session);
  if (!result) return false;
  if (result.isSatisfied) return true;
  const versions = await getNodeVersion(session);
  logVersions(session, versions, false);
  session.log.error('Please update your Node or NPM versions.\n');
  session.log.info(INSTALL_NODE_MESSAGE);
  return false;
}

type SessionOpts = {
  debug?: boolean;
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
    anonymous?: boolean;
    requireSiteConfig?: boolean;
    hideNoTokenWarning?: boolean;
  },
  nArgs?: number,
) {
  return async (...args: any[]) => {
    const opts = cli.program.opts() as SessionOpts;
    const useSession = cli.anonymous
      ? anonSession(opts)
      : getSession({ ...opts, hideNoTokenWarning: cli.hideNoTokenWarning });
    const versions = await getNodeVersion(useSession);
    logVersions(useSession, versions);
    const versionsInstalled = await checkNodeVersion(useSession);
    if (!versionsInstalled) process.exit(1);
    const state = useSession.store.getState();
    // TODO: These should no longer need '.', but instead selectCurrent*Config
    const siteConfig = selectors.selectLocalSiteConfig(state, '.');
    if (cli.requireSiteConfig && !siteConfig) {
      const projectConfig = selectors.selectLocalProjectConfig(state, '.');
      let message: string;
      if (projectConfig) {
        message = `No "site" config found in ${projectConfig.file}`;
      } else {
        message = `You must be in a directory with a config file: ${useSession.configFiles.join(
          ', ',
        )}`;
      }
      useSession.log.error(`${message}\n\nDo you need to run: ${chalk.bold('curvenote init')}`);
      process.exit(1);
    }
    try {
      await func(useSession, ...args.slice(0, nArgs));
    } catch (error) {
      if (opts.debug) {
        useSession.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
      useSession.log.error((error as Error).message);
      logVersions(useSession, versions, false);
      process.exit(1);
    }
  };
}
