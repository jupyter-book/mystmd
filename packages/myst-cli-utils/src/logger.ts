import type { ISession, Logger, LoggerDE } from './types';
import chalk from 'chalk';

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

export function chalkLogger(level: LogLevel): Logger {
  return {
    debug(...args: any) {
      if (level > LogLevel.debug) return;
      console.debug(chalk.dim(...args));
    },
    info(...args: any) {
      if (level > LogLevel.info) return;
      console.log(chalk.reset(...args));
    },
    warn(...args: any) {
      if (level > LogLevel.warn) return;
      console.warn(chalk.yellow(...args));
    },
    error(...args: any) {
      if (level > LogLevel.error) return;
      console.error(chalk.red(...args));
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
      if (line.startsWith('Cloning into') || line.startsWith('Submodule')) {
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
      if (
        line.includes('deprecated') ||
        line.includes('package is no longer supported') ||
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
