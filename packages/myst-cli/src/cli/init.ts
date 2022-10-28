import { Command, Option } from 'commander';
import { init } from '../build';
import { Session } from '../session';
import { clirun } from './clirun';

export function makeWriteTocOption() {
  return new Option(
    '--write-toc',
    'Generate editable _toc.yml file for project if it does not exist',
  ).default(false);
}

export function makeInitCLI(program: Command) {
  const command = new Command('init')
    .description('Initialize a myst project in the current directory')
    .addOption(makeWriteTocOption())
    .action(clirun(Session, init, program));
  return command;
}
