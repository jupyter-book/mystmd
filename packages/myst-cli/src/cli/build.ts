import { Command } from 'commander';
import { build } from '../build';
import { Session } from '../session';
import { clirun } from './clirun';
import {
  makeCheckLinksOption,
  makeDocxOption,
  makeForceOption,
  makeJatsOption,
  makePdfOption,
  makeSiteOption,
  makeStrictOption,
  makeTexOption,
  makeAllOption,
  makeNamedExportOption,
} from './options';

export function makeBuildCLI(program: Command) {
  const command = new Command('build')
    .description('Build PDF, LaTeX, Word and website exports from MyST files')
    .argument('[files...]', 'list of files to export')
    .addOption(makePdfOption('Build PDF output'))
    .addOption(makeTexOption('Build LaTeX outputs'))
    .addOption(makeDocxOption('Build Docx output'))
    .addOption(makeJatsOption('Build JATS xml output'))
    .addOption(makeSiteOption('Build MyST site content'))
    .addOption(makeAllOption('Build all exports'))
    .addOption(makeNamedExportOption('Output file for the export'))
    .addOption(makeForceOption())
    .addOption(makeCheckLinksOption())
    .addOption(makeStrictOption())
    .action(clirun(Session, build, program));
  return command;
}
