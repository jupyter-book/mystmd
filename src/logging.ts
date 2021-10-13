import chalk from 'chalk';

export enum LogLevel {
  fatal = 60,
  error = 50,
  warn = 40,
  info = 30,
  debug = 20,
  trace = 10,
}
export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export function basicLogger(level: LogLevel): Logger {
  const { log } = console;
  return {
    debug(...args: any) {
      if (level > LogLevel.debug) return;
      log(...args);
    },
    info(...args: any) {
      if (level > LogLevel.info) return;
      log(...args);
    },
    warn(...args: any) {
      if (level > LogLevel.warn) return;
      log(...args);
    },
    error(...args: any) {
      if (level > LogLevel.error) return;
      log(...args);
    },
  };
}

export function chalkLogger(level: LogLevel): Logger {
  const { log } = console;
  return {
    debug(...args: any) {
      if (level > LogLevel.debug) return;
      log(chalk.white(...args));
    },
    info(...args: any) {
      if (level > LogLevel.info) return;
      log(chalk.white(...args));
    },
    warn(...args: any) {
      if (level > LogLevel.warn) return;
      log(chalk.yellow(...args));
    },
    error(...args: any) {
      if (level > LogLevel.error) return;
      log(chalk.red(...args));
    },
  };
}
