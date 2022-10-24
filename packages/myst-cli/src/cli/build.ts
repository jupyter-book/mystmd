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

export function makeWebOption() {
  return new Option('--web', 'Build web outputs').default(false);
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

export function makeStrictOption() {
  return new Option('--strict', 'Summarize build warnings and stop on any errors.').default(false);
}

export function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description('Build pdf, tex, word, and web exports from MyST files')
    // .argument('[input]', 'Input MyST file, config file, or folder')
    // .argument(
    //   '[output]',
    //   'Output file or folder; may only be used if single input file is specified',
    // )
    .addOption(makePdfOption())
    .addOption(makeTexOption())
    .addOption(makeDocxOption())
    .addOption(makeWebOption())
    .addOption(makeCleanOption())
    .addOption(makeWriteTocOption())
    .addOption(makeStrictOption())
    .addOption(makeCheckLinksOption())
    .action(clirun(Session, build, program));
  return command;
}
