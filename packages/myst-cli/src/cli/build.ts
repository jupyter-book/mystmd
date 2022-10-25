import { Command, Option } from 'commander';
import { build } from '../build/build';
import { Session } from '../session';
import { clirun } from './clirun';

export function makePdfOption() {
  return new Option('--pdf', 'Build PDF output').default(false);
}

export function makeTexOption() {
  return new Option('--tex', 'Build Tex outputs').default(false);
}

export function makeDocxOption() {
  return new Option('--word, --docx', 'Build Docx output').default(false);
}

export function makeFileOption() {
  return new Option('-f, --file <file>', 'Single file to export').default('');
}

export function makeOutputOption() {
  return new Option('-o, --output <folder>', 'Output folder for exports').default('');
}

export function makeCleanOption() {
  return new Option('-c, --clean', 'Remove content so that it is rebuilt fresh').default(false);
}

export function makeCheckLinksOption() {
  return new Option('--check-links', 'Check all links to websites resolve.').default(false);
}

export function makeWriteTocOption() {
  return new Option(
    '--write-toc',
    'Generate editable _toc.yml file for project if it does not exist',
  ).default(false);
}

export function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description('Build pdf, tex, and word exports from MyST files')
    .addOption(makePdfOption())
    .addOption(makeTexOption())
    .addOption(makeDocxOption())
    .addOption(makeFileOption())
    .addOption(makeOutputOption())
    .addOption(makeCleanOption())
    .addOption(makeWriteTocOption())
    .addOption(makeCheckLinksOption())
    .action(clirun(Session, build, program));
  return command;
}
