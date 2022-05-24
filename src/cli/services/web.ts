import { Command, Option } from 'commander';
import { web } from '../../index';
import { clirun } from './utils';
import { makeYesOption } from './utils/options';

function makeBranchOption() {
  return new Option(
    '--branch [branch]',
    'Branch to clone from git@github.com:curvenote/curvespace.git',
  ).default('main');
}
function makeCleanOption() {
  return new Option('-c, --clean', 'Remove content so that it is rebuilt fresh').default(false);
}
function makeForceOption() {
  return new Option('-f, --force', 'Remove the build directory and re-install').default(false);
}
function makeCIOption() {
  return new Option('-ci, --ci', 'Perform a minimal build, for use on CI').default(false);
}

function makeCurvespaceCleanCLI(program: Command) {
  const command = new Command('clean')
    .description('Install dependencies for serving')
    .action(clirun(web.clean, { program, requireConfig: true }));
  return command;
}

function makeCurvespaceCloneCLI(program: Command) {
  const command = new Command('clone')
    .description('Clone curvespace into the build directory')
    .addOption(makeBranchOption())
    .action(clirun(web.clone, { program, requireConfig: true }));
  return command;
}

function makeCurvespaceInstallCLI(program: Command) {
  const command = new Command('install')
    .description('Install dependencies for serving')
    .action(clirun(web.install, { program, requireConfig: true }));
  return command;
}

function makeCurvespaceStartCLI(program: Command) {
  const command = new Command('start')
    .description('Start a local project as a web server')
    .addOption(makeCleanOption())
    .addOption(makeForceOption())
    .addOption(makeBranchOption())
    .action(clirun(web.serve2, { program, requireConfig: true }));
  return command;
}

function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description('Deploy content to https://*.curve.space or your own domain')
    .addOption(makeCleanOption())
    .addOption(makeForceOption())
    .addOption(makeBranchOption())
    .addOption(makeCIOption())
    .action(clirun(web.build, { program, requireConfig: true }));
  return command;
}

function makeDeployCLI(program: Command) {
  const command = new Command('deploy')
    .description('Deploy content to https://*.curve.space or your own domain')
    .addOption(makeForceOption())
    .addOption(makeYesOption())
    .action(clirun(web.deploy, { program, requireConfig: true }));
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
