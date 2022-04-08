import util from 'util';
import child_process from 'child_process';
import prettyHrtime from 'pretty-hrtime';
import { Logger } from '~/logging';

function execWrapper(
  command: string,
  callback?: (error: child_process.ExecException | null, stdout: string, stderr: string) => void,
) {
  const childProcess = child_process.exec(command, callback);
  childProcess.stdout?.pipe(process.stdout);
  childProcess.stderr?.pipe(process.stderr);
  return childProcess;
}

const exec = util.promisify(execWrapper);

function makeExecWrapper(command: string, log: Pick<Logger, 'debug' | 'error'> | null) {
  return function inner(
    callback?: (error: child_process.ExecException | null, stdout: string, stderr: string) => void,
  ) {
    const childProcess = child_process.exec(command, callback);
    childProcess.stdout?.on('data', (data: any) => log?.debug(data));
    childProcess.stderr?.on('data', (data: any) => log?.error(data));
    return childProcess;
  };
}

export function makeExecutable(command: string, log: Pick<Logger, 'debug' | 'error'> | null) {
  return util.promisify(makeExecWrapper(command, log));
}

export function tic() {
  let start = process.hrtime();
  function toc(f = '') {
    const time = prettyHrtime(process.hrtime(start));
    start = process.hrtime();
    return f ? f.replace('%s', time) : time;
  }
  return toc;
}

export default exec;
