import { Command } from 'commander';
import { startServer } from '../build/site/start';
import { Session } from '../session';
import { clirun } from './clirun';
import { makeKeepHostOption, makeHeadlessOption } from './options';

export function makeStartCLI(program: Command) {
  const command = new Command('start')
    .description('Start the current project as a website')
    .addOption(makeKeepHostOption())
    .addOption(makeHeadlessOption())
    .action(clirun(Session, startServer, program));
  return command;
}
