import { Command } from 'commander';
import { Session, startServer } from 'myst-cli';
import { clirun } from './clirun.js';
import { makeKeepHostOption, makeHeadlessOption } from './options.js';

export function makeStartCLI(program: Command) {
  const command = new Command('start')
    .description('Start the current project as a website')
    .addOption(makeKeepHostOption())
    .addOption(makeHeadlessOption())
    .action(clirun(Session, startServer, program));
  return command;
}
