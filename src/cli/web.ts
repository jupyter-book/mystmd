import { Command } from 'commander';
import { web } from '../index';
import { clirun } from './utils';
import {
  makeBranchOption,
  makeCIOption,
  makeCleanOption,
  makeForceOption,
  makeYesOption,
} from './options';

function makeCurvespaceCleanCLI(program: Command) {
  const command = new Command('clean')
    .description('Install dependencies for serving')
    .action(clirun(web.clean, { program, requireSiteConfig: true }));
  return command;
}

function makeCurvespaceCloneCLI(program: Command) {
  const command = new Command('clone')
    .description('Clone curvespace into the build directory')
    .addOption(makeBranchOption())
    .action(clirun(web.clone, { program, requireSiteConfig: true }));
  return command;
}

function makeCurvespaceInstallCLI(program: Command) {
  const command = new Command('install')
    .description('Install dependencies for serving')
    .action(clirun(web.install, { program, requireSiteConfig: true }));
  return command;
}

function makeCurvespaceStartCLI(program: Command) {
  const command = new Command('start')
    .description('Start a local project as a web server')
    .addOption(makeCleanOption())
    .addOption(makeForceOption())
    .addOption(makeBranchOption())
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
    .action(clirun(web.deploy, { program, requireSiteConfig: true }));
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
  command.addCommand(makeDeployCLI(program));
  command.addCommand(makeBuildCLI(program));
  program.addCommand(command);
  // Add a `start` and `deploy` shortcut at the top level
  program.addCommand(makeCurvespaceStartCLI(program));
  program.addCommand(makeDeployCLI(program));
}
