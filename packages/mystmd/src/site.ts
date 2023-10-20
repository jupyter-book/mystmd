import { Command } from 'commander';
import { Session, startServer } from 'myst-cli';
import { clirun } from './clirun.js';
import {
  makeKeepHostOption,
  makeHeadlessOption,
  makePortOption,
  makeServerPortOption,
} from './options.js';

export function makeStartCLI(program: Command) {
  const command = new Command('start')
    .description('Start the current project as a website')
    .addOption(makeKeepHostOption())
    .addOption(makeHeadlessOption())
    .addOption(makePortOption())
    .addOption(makeServerPortOption())
    .action(clirun(Session, startServer, program));
  return command;
}
