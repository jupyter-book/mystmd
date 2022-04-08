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
    .option(
      '--branch [branch]',
      'Branch to clone from git@github.com:curvenote/curvespace.git',
      'main',
    )
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
    .option('-C, --clean', 'Remove content so that it is rebuilt fresh', false)
    .option('-F, --force', 'Remove the build directory and re-install', false)
    .action(clirun(web.serve, { program }));
  return command;
}

function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description('Deploy content to https://*.curve.space or your own domain')
    .option('-C, --clean', 'Remove content so that it is rebuilt fresh', false)
    .option('-F, --force', 'Remove the build directory and re-install', false)
    .action(clirun(web.build, { program }));
  return command;
}

function makeDeployCLI(program: Command) {
  const command = new Command('deploy')
    .alias('publish')
    .description('Deploy content to https://*.curve.space or your own domain')
    .option('-F, --force', 'Remove the build directory and re-install', false)
    .action(clirun(web.deploy, { program }));
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
