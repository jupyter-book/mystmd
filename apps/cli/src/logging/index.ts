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

export function getLevel(logger: Logger, level: LogLevel): Logger['info'] {
  switch (level) {
    case LogLevel.trace:
    case LogLevel.debug:
      return logger.debug;
    case LogLevel.info:
      return logger.info;
    case LogLevel.warn:
      return logger.warn;
    case LogLevel.error:
    case LogLevel.fatal:
      return logger.error;
    default:
      throw new Error(`Level "${level}" not defined.`);
  }
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
