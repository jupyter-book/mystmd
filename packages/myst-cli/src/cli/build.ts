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

export function makeForceOption() {
  return new Option(
    '--force',
    'Build outputs for the given format, even if corresponding exports are not defined in file frontmatter',
  ).default(false);
}

export function makeCheckLinksOption() {
  return new Option('--check-links', 'Check all links to websites resolve.').default(false);
}

export function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description('Build pdf, tex, and word exports from MyST files')
    .argument('[files...]', 'list of files to export')
    .addOption(makePdfOption())
    .addOption(makeTexOption())
    .addOption(makeDocxOption())
    .addOption(makeForceOption())
    .addOption(makeCheckLinksOption())
    .action(clirun(Session, build, program));
  return command;
}
