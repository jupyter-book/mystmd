import { Command } from 'commander';
import { startServer } from '../build/site/start.js';
import { Session } from '../session/index.js';
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
