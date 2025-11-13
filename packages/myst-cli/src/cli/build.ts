import { Command } from 'commander';
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
  makeHtmlOption,
  makeMecaOptions,
  makeMdOption,
  makeTypstOption,
  makeWatchOption,
  makeCIOption,
  makeExecuteOption,
  makeExecuteConcurrencyOption,
  makeMaxSizeWebpOption,
  makeDOIBibOption,
  makeCffOption,
  makeKeepHostOption,
  makePortOption,
} from './options.js';
import { readableName } from '../utils/whiteLabelling.js';

export function makeBuildCommand() {
  const command = new Command('build')
    .description('Build PDF, LaTeX, Word and website exports from MyST files')
    .argument('[files...]', 'list of files to export')
    .addOption(makeExecuteOption('Execute Notebooks'))
    .addOption(makeExecuteConcurrencyOption())
    .addOption(makePdfOption('Build PDF output'))
    .addOption(makeTexOption('Build LaTeX outputs'))
    .addOption(makeTypstOption('Build Typst outputs'))
    .addOption(makeDocxOption('Build Docx output'))
    .addOption(makeMdOption('Build MD output'))
    .addOption(makeJatsOption('Build JATS xml output'))
    .addOption(makeMecaOptions('Build MECA zip output'))
    .addOption(makeCffOption('Build CFF output'))
    .addOption(makeSiteOption(`Build ${readableName()} site content`))
    .addOption(makeHtmlOption('Build static HTML site content'))
    .addOption(makeAllOption('Build all exports'))
    .addOption(makeDOIBibOption())
    .addOption(makeWatchOption())
    .addOption(makeNamedExportOption('Output file for the export'))
    .addOption(
      makeForceOption(
        'Build outputs for the given format, even if corresponding exports are not defined in file frontmatter',
      ),
    )
    .addOption(makeCheckLinksOption())
    .addOption(makeStrictOption())
    .addOption(makeCIOption())
    .addOption(makeMaxSizeWebpOption())
    .addOption(makeKeepHostOption())
    .addOption(makePortOption());
  return command;
}
