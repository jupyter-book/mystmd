import { Command } from 'commander';
import { web } from '../index';
import { clirun } from './utils';
import {
  makeBranchOption,
  makeCIOption,
  makeCleanOption,
  makeForceOption,
  makeYesOption,
  makeWriteTocOption,
} from './options';

function makeCurvenoteCleanCLI(program: Command) {
  const command = new Command('clean')
    .description('Install dependencies for serving')
    .action(clirun(web.clean, { program, requireSiteConfig: true }));
  return command;
}

function makeCurvenoteCloneCLI(program: Command) {
  const command = new Command('clone')
    .description('Clone curvespace into the build directory')
    .addOption(makeBranchOption())
    .action(clirun(web.clone, { program, requireSiteConfig: true }));
  return command;
}

function makeCurvenoteInstallCLI(program: Command) {
  const command = new Command('install')
    .description('Install dependencies for serving')
    .action(clirun(web.install, { program, requireSiteConfig: true }));
  return command;
}

function makeCurvenoteStartCLI(program: Command) {
  const command = new Command('start')
    .description('Start a local project as a web server')
    .addOption(makeCleanOption())
    .addOption(makeForceOption())
    .addOption(makeBranchOption())
    .addOption(makeWriteTocOption())
    .action(clirun(web.startServer, { program, requireSiteConfig: true }));
  return command;
}

function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description('Deploy content to https://*.curve.space or your own domain')
    .addOption(makeCleanOption())
    .addOption(makeForceOption())
    .addOption(makeBranchOption())
    .addOption(makeCIOption())
    .action(clirun(web.build, { program, requireSiteConfig: true }));
  return command;
}

function makeDeployCLI(program: Command) {
  const command = new Command('deploy')
    .description('Deploy content to https://*.curve.space or your own domain')
    .addOption(makeForceOption())
    .addOption(makeYesOption())
    .addOption(makeCIOption())
    .action(clirun(web.deploy, { program, requireSiteConfig: true }));
  return command;
}

export function addWebCLI(program: Command): void {
  const command = new Command('web').description(
    'Commands to clone, install, and start a webserver',
  );
  command.addCommand(makeCurvenoteCleanCLI(program));
  command.addCommand(makeCurvenoteCloneCLI(program));
  command.addCommand(makeCurvenoteInstallCLI(program));
  command.addCommand(makeCurvenoteStartCLI(program));
  command.addCommand(makeDeployCLI(program));
  command.addCommand(makeBuildCLI(program));
  program.addCommand(command);
  // Add a `start` and `deploy` shortcut at the top level
  program.addCommand(makeCurvenoteStartCLI(program));
  program.addCommand(makeDeployCLI(program));
}
