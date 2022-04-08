import { Command } from 'commander';
import { sync } from '../../index';
import { clirun } from './utils';

function makeSyncInitCLI(program: Command) {
  const command = new Command('init')
    .description('Initialize a Curvenote project')
    .action(clirun(sync.init, { program }));
  return command;
}

function makeSyncPullCLI(program: Command) {
  const command = new Command('pull')
    .description('Pull all information for a Curvenote project')
    .argument('[folder]', 'The location of the content to pull')
    .action(clirun(sync.pull, { program, requireConfig: true }));
  return command;
}

function makeSyncAddCLI(program: Command) {
  const command = new Command('add')
    .description('Add content to your Curvenote project')
    .action(clirun(sync.add, { program, requireConfig: true }));
  return command;
}

export function addSyncCLI(program: Command) {
  const command = new Command('sync').description(
    'Commands to clone, install, and start a webserver',
  );
  command.addCommand(makeSyncInitCLI(program));
  command.addCommand(makeSyncPullCLI(program));
  command.addCommand(makeSyncAddCLI(program));
  program.addCommand(command);
  // Add a `init` and `pull` shortcut at the top level
  program.addCommand(makeSyncInitCLI(program));
  program.addCommand(makeSyncPullCLI(program));
}
