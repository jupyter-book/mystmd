import { Command, Option } from 'commander';
import { clean } from '../build';
import { Session } from '../session';
import { clirun } from './clirun';
import {
  makeDocxOption,
  makePdfOption,
  makeSiteOption,
  makeTexOption,
  makeYesOption,
} from './options';

export function makeTempOption() {
  return new Option(
    '--temp',
    'Delete the _build/temp folder where intermediate build artifacts are saved',
  ).default(false);
}

export function makeExportsOption() {
  return new Option(
    '--exports',
    'Delete the _build/exports folder where exports are saved by default',
  ).default(false);
}

export function makeTemplatesOption() {
  return new Option(
    '--templates',
    'Delete the _build/templates folder where downloaded templates are saved',
  ).default(false);
}

export function makeAllOption() {
  return new Option(
    '-a, --all',
    'Delete all exports, site content, templates, and temp files created by MyST',
  ).default(false);
}

export function makeCleanCLI(program: Command) {
  const command = new Command('clean')
    .description('Clean built pdf, tex, and word exports and other build artifacts')
    .argument('[files...]', 'list of files to clean corresponding outputs')
    .addOption(makePdfOption('Clean'))
    .addOption(makeTexOption('Clean'))
    .addOption(makeDocxOption('Clean'))
    .addOption(makeSiteOption('Clean'))
    .addOption(makeTempOption())
    .addOption(makeExportsOption())
    .addOption(makeTemplatesOption())
    .addOption(makeAllOption())
    .addOption(makeYesOption())
    .action(clirun(Session, clean, program));
  return command;
}
