import { Command, Option } from 'commander';
import { build } from '../build';
import { Session } from '../session';
import { clirun } from './clirun';
import { makeDocxOption, makePdfOption, makeTexOption, makeYesOption } from './options';

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
    .addOption(makeYesOption())
    .action(clirun(Session, build, program));
  return command;
}
