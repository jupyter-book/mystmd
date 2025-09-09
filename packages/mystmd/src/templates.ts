import { Command } from 'commander';
import {
  Session,
  downloadTemplateCLI,
  startTemplateCLI,
  listTemplatesCLI,
  makeDocxOption,
  makeForceOption,
  makePdfOption,
  makeSiteOption,
  makeTexOption,
  makeTypstOption,
  makeCDNOption,
} from 'myst-cli';
import { clirun } from './clirun.js';

function makeStartCLI(program: Command) {
  const command = new Command('start')
    .description('Start a public site template')
    .argument('<template>', 'The template URL or name')
    .addOption(makeCDNOption('Use specific content server'))
    .addOption(makeForceOption('Overwrite existing downloaded templates'))
    .action(clirun(Session, startTemplateCLI, program, { keepAlive: true }));
  return command;
}

function makeDownloadCLI(program: Command) {
  const command = new Command('download')
    .description('Download a public template to a path')
    .argument('<template>', 'The template URL or name')
    .argument('[path]', 'A folder to download and unzip the template to')
    .addOption(makePdfOption('Download PDF template'))
    .addOption(makeTexOption('Download LaTeX template'))
    .addOption(makeTypstOption('Download Typst template'))
    .addOption(makeDocxOption('Download Docx template'))
    .addOption(makeSiteOption('Download Site template'))
    .addOption(makeForceOption('Overwrite existing downloaded templates'))
    .action(clirun(Session, downloadTemplateCLI, program));
  return command;
}

function makeListCLI(program: Command) {
  const command = new Command('list')
    .description('List, filter or lookup details on public templates')
    .argument('[name]', 'The optional name to list about a specific template')
    .addOption(makePdfOption('List PDF templates'))
    .addOption(makeTexOption('List LaTeX templates'))
    .addOption(makeTypstOption('List Typst templates'))
    .addOption(makeDocxOption('List Docx templates'))
    .addOption(makeSiteOption('List Site templates'))
    .option(
      '--tag <tag>',
      'Any tags to filter the list by multiple tags can be joined with a comma.',
    )
    .action(clirun(Session, listTemplatesCLI, program));
  return command;
}

export function makeTemplatesCLI(program: Command) {
  const command = new Command('templates')
    .description('List and download templates')
    .addCommand(makeStartCLI(program))
    .addCommand(makeListCLI(program))
    .addCommand(makeDownloadCLI(program));
  return command;
}
