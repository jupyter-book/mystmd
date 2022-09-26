import type { Logger } from './types';
import chalk from 'chalk';

export enum LogLevel {
  fatal = 60,
  error = 50,
  warn = 40,
  info = 30,
  debug = 20,
  trace = 10,
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
