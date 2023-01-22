import type { ISession, Logger, LoggerDE } from './types';
import chalk from 'chalk';
import { sep } from 'path';

export enum LogLevel {
  fatal = 60,
  error = 50,
  warn = 40,
  info = 30,
  debug = 20,
  trace = 10,
}

export function basicLogger(level: LogLevel): Logger {
  return {
    debug(...args: any) {
      if (level > LogLevel.debug) return;
      console.debug(...args);
    },
    info(...args: any) {
      if (level > LogLevel.info) return;
      console.log(...args);
    },
    warn(...args: any) {
      if (level > LogLevel.warn) return;
      console.warn(...args);
    },
    error(...args: any) {
      if (level > LogLevel.error) return;
      console.error(...args);
    },
  };
}

export function silentLogger(): Logger {
  return {
    debug() {
      // pass
    },
    info() {
      // pass
    },
    warn() {
      // pass
    },
    error() {
      // pass
    },
  };
}

function replaceCwd(cwd: string | undefined, args: any[]): any[] {
  if (!cwd) return args;
  return args.map((a) => {
    if (typeof a === 'string') {
      return a.replaceAll(cwd + sep, '');
    }
    return a;
  });
}

export function chalkLogger(level: LogLevel, cwd?: string): Logger {
  return {
    debug(...args: any) {
      if (level > LogLevel.debug) return;
      console.debug(chalk.dim(...args));
    },
    info(...args: any) {
      if (level > LogLevel.info) return;
      console.log(chalk.reset(...replaceCwd(cwd, args)));
    },
    warn(...args: any) {
      if (level > LogLevel.warn) return;
      console.warn(chalk.yellow(...replaceCwd(cwd, args)));
    },
    error(...args: any) {
      if (level > LogLevel.error) return;
      console.error(chalk.red(...replaceCwd(cwd, args)));
    },
  };
}

export function createGitLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      if (!line) return;
      session.log.debug(data);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      if (
        line.includes('Cloning into') ||
        line.includes('Submodule') ||
        line.includes('From https://github.com')
      ) {
        session.log.debug(line);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}

export function createNpmLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      if (!line) return;
      session.log.debug(data);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      const lower = line.toLowerCase();
      if (
        // There are a lot of deprecation warnings that we want to hide to myst users
        lower.includes('deprecated') ||
        lower.includes('no longer supported') ||
        lower.includes('do not need') ||
        lower.includes('please use') ||
        lower.includes('functionality') ||
        lower.includes('has been moved') ||
        line === 'npm' ||
        line.includes('WARN')
      ) {
        session.log.debug(line);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}
