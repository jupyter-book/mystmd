import util from 'util';
import child_process from 'child_process';
import { Logger } from '../../logging';

function execWrapper(
  command: string,
  options?: { cwd?: string },
  callback?: (error: child_process.ExecException | null, stdout: string, stderr: string) => void,
) {
  const childProcess = child_process.exec(command, options ?? {}, callback);
  childProcess.stdout?.pipe(process.stdout);
  childProcess.stderr?.pipe(process.stderr);
  return childProcess;
}

const exec = util.promisify(execWrapper);

function makeExecWrapper(
  command: string,
  log: Pick<Logger, 'debug' | 'error'> | null,
  options?: { cwd?: string },
) {
  return function inner(
    callback?: (error: child_process.ExecException | null, stdout: string, stderr: string) => void,
  ) {
    const childProcess = child_process.exec(command, options ?? {}, callback);
    childProcess.stdout?.on('data', (data: any) => log?.debug(data));
    childProcess.stderr?.on('data', (data: any) => log?.error(data));
    return childProcess;
  };
}

export function makeExecutable(
  command: string,
  log: Pick<Logger, 'debug' | 'error'> | null,
  options?: { cwd?: string },
) {
  return util.promisify(makeExecWrapper(command, log, options));
}

export default exec;
