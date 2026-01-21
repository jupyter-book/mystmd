import util from 'util';
import type { ExecOptions } from 'child_process';
import child_process from 'child_process';
import type { Logger } from './types.js';
import treeKill from 'tree-kill';

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

/**
 * On Linux, child processes will not be terminated when attempting to kill their parent
 * This function uses `tree-kill` to kill the process and all its child processes
 */
export function killProcessTree(process: child_process.ChildProcess) {
  if (!process.pid) {
    process.kill('SIGTERM');
    return;
  }
  treeKill(process.pid, 'SIGTERM', (err) => {
    if (err && process.pid) {
      treeKill(process.pid, 'SIGKILL');
    }
  });
}
