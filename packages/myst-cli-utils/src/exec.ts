import util from 'util';
import type { ExecOptions } from 'child_process';
import child_process from 'child_process';
import type { Logger } from './types.js';

function execWrapper(
  command: string,
  options?: child_process.ExecOptionsWithStringEncoding,
  callback?: (error: child_process.ExecException | null, stdout: string, stderr: string) => void,
) {
  const childProcess = child_process.exec(command, options ?? {}, callback);
  childProcess.stdout?.pipe(process.stdout);
  childProcess.stderr?.pipe(process.stderr);
  return childProcess;
}

export const exec = util.promisify(execWrapper);

type Options = ExecOptions & { getProcess?: (process: child_process.ChildProcess) => void };

function makeExecWrapper(
  command: string,
  log: Pick<Logger, 'debug' | 'error'> | null,
  options?: Options,
) {
  return function inner(
    callback?: (
      error: child_process.ExecException | null,
      stdout: string | Buffer,
      stderr: string | Buffer,
    ) => void,
  ) {
    const childProcess = child_process.exec(command, (options ?? {}) as ExecOptions, callback);
    childProcess.stdout?.on('data', (data: any) => log?.debug(data));
    childProcess.stderr?.on('data', (data: any) => log?.error(data));
    options?.getProcess?.(childProcess);
    return childProcess;
  };
}

export function makeExecutable(
  command: string,
  log: Pick<Logger, 'debug' | 'error'> | null,
  options?: Options,
) {
  return util.promisify(makeExecWrapper(command, log, options)) as () => Promise<string>;
}
