import { Command } from 'commander';
import { web } from '../../index';
import { clirun } from './utils';

function makeCurvespaceCleanCLI(program: Command) {
  const command = new Command('clean')
    .description('Install dependencies for serving')
    .action(clirun(web.clean, { program }));
  return command;
}

function makeCurvespaceCloneCLI(program: Command) {
  const command = new Command('clone')
    .description('Clone curvespace into the build directory')
    .action(clirun(web.clone, { program }));
  return command;
}

function makeCurvespaceInstallCLI(program: Command) {
  const command = new Command('install')
    .description('Install dependencies for serving')
    .action(clirun(web.install, { program }));
  return command;
}

function makeCurvespaceStartCLI(program: Command) {
  const command = new Command('start')
    .alias('serve')
    .description('Start a local project as a web server')
    .option('-F, --force', 'Remove the build directory and re-install', false)
    .action(clirun(web.serve, { program }));
  return command;
}

export function addWebCLI(program: Command) {
  const command = new Command('web').description(
    'Commands to clone, install, and start a webserver',
  );
  command.addCommand(makeCurvespaceCleanCLI(program));
  command.addCommand(makeCurvespaceCloneCLI(program));
  command.addCommand(makeCurvespaceInstallCLI(program));
  command.addCommand(makeCurvespaceStartCLI(program));
  program.addCommand(command);
  // Add a `start` shortcut at the top level
  program.addCommand(makeCurvespaceStartCLI(program));
}
