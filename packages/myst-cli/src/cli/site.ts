import { Command } from 'commander';
import { startServer } from '../build/site/start';
import { Session } from '../session';
import { clirun } from './clirun';
import {
  makeBranchOption,
  makeForceOption,
  makeKeepHostOption,
  makeHeadlessOption,
} from './options';

export function makeStartCLI(program: Command) {
  const command = new Command('start')
    .description('Start a local project as a web server')
    .addOption(makeForceOption())
    .addOption(makeBranchOption())
    .addOption(makeKeepHostOption())
    .addOption(makeHeadlessOption())
    .action(clirun(Session, startServer, program));
  return command;
}
