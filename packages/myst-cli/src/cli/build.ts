import { Command } from 'commander';
import { build } from '../build';
import { Session } from '../session';
import { clirun } from './clirun';
import {
  makeCheckLinksOption,
  makeDocxOption,
  makeForceOption,
  makePdfOption,
  makeSiteOption,
  makeStrictOption,
  makeTexOption,
} from './options';

export function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description(
      'Build pdf, tex, and word exports from MyST files as well as build MyST site content',
    )
    .argument('[files...]', 'list of files to export')
    .addOption(makePdfOption('Build'))
    .addOption(makeTexOption('Build'))
    .addOption(makeDocxOption('Build'))
    .addOption(makeSiteOption('Build'))
    .addOption(makeForceOption())
    .addOption(makeCheckLinksOption())
    .addOption(makeStrictOption())
    .action(clirun(Session, build, program));
  return command;
}
