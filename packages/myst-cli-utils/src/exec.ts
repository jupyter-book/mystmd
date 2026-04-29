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
 * On Unix-like systems, killing a process does not propagate to its children,
 * they get re-parented and keep running. This uses                           
 * `tree-kill` to discover and kill the parent process *and* all of its descendants.
 *
 * Returns a Promise that resolves once `tree-kill` has issued its signals.
 * This allows callers to await these signals before moving on, which prevents a case
 * where node exits before the signals are sent, and we're left with orphaned processes.
 */
export function killProcessTree(process: child_process.ChildProcess): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!process.pid) {
      process.kill('SIGTERM');
      resolve();
      return;
    }
    treeKill(process.pid, 'SIGTERM', (err) => {
      if (err && process.pid) {
        treeKill(process.pid, 'SIGKILL', () => resolve());
      } else {
        resolve();
      }
    });
  });
}
