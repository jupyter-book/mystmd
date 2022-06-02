import { Option } from 'commander';

export function makeYesOption() {
  return new Option('-y, --yes', 'Use the defaults and answer "Y" to confirmations').default(false);
}

export function makeDomainOption() {
  return new Option(
    '-dm, --domain <string>',
    'Specify a custom domain during initializaton',
  ).default(undefined);
}

export function makeBranchOption() {
  return new Option(
    '--branch [branch]',
    'Branch to clone from git@github.com:curvenote/curvespace.git',
  ).default('main');
}

export function makeCleanOption() {
  return new Option('-c, --clean', 'Remove content so that it is rebuilt fresh').default(false);
}
export function makeForceOption() {
  return new Option('-f, --force', 'Remove the build directory and re-install').default(false);
}
export function makeCIOption() {
  return new Option('-ci, --ci', 'Perform a minimal build, for use on CI').default(false);
}
