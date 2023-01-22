import { Command, Option } from 'commander';
import { init } from '../build';
import { Session } from '../session';
import { clirun } from './clirun';
import { makeProjectOption, makeSiteOption } from './options';

export function makeWriteTocOption() {
  return new Option(
    '--write-toc',
    'Generate editable _toc.yml file for project if it does not exist',
  ).default(false);
}

export function makeInitCLI(program: Command) {
  const command = new Command('init')
    .description('Initialize a MyST project in the current directory')
    .addOption(makeProjectOption('Initialize config for MyST project content'))
    .addOption(makeSiteOption('Initialize config for MyST site'))
    .addOption(makeWriteTocOption())
    .action(clirun(Session, init, program));
  // The default command runs `myst init`
  program.action(clirun(Session, init, program));
  return command;
}
