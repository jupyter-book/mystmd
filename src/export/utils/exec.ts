import util from 'util';
import child_process from 'child_process';

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

export default exec;
