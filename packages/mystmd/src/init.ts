import chalk from 'chalk';
import { Command } from 'commander';
import { Session, init } from 'myst-cli';
import { clirun } from './clirun.js';
import {
  makeGithubActionOption,
  makeProjectOption,
  makeSiteOption,
  makeWriteTocOption,
} from './options.js';

export function makeInitCLI(program: Command) {
  const command = new Command('init')
    .description('Initialize a MyST project in the current directory')
    .addOption(makeProjectOption('Initialize config for MyST project content'))
    .addOption(makeSiteOption('Initialize config for MyST site'))
    .addOption(makeWriteTocOption())
    .addOption(makeGithubActionOption())
    .action(clirun(Session, init, program));
  return command;
}

// The default command runs `myst init` with no arguments
export function addDefaultCommand(program: Command) {
  program.action(async (...args: any[]) => {
    if (program.args.length === 0) return clirun(Session, init, program)(args);
    console.error(
      `${chalk.red(`Invalid command: `)}${chalk.bold(program.args.join(' '))}\n\n${chalk.dim(
        'See --help for a list of available commands.\n',
      )}`,
    );
    console.log(program.helpInformation());
    process.exit(1);
  });
}
