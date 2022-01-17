import util from 'util';
import child_process from 'child_process';
import { Logger } from '../../logging';

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

function makeExecWrapper(command: string, log: Logger) {
  return function inner(
    callback?: (error: child_process.ExecException | null, stdout: string, stderr: string) => void,
  ) {
    const childProcess = child_process.exec(command, callback);
    childProcess.stdout?.on('data', (data: any) => log.info(data));
    childProcess.stderr?.on('data', (data: any) => log.error(data));
    return childProcess;
  };
}

export function makeExecutable(command: string, log: Logger) {
  return util.promisify(makeExecWrapper(command, log));
}

export default exec;
