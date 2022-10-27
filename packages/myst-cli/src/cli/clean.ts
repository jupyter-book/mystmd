import { Command, Option } from 'commander';
import { clean } from '../build/clean';
import { Session } from '../session';
import { clirun } from './clirun';
import { makeDocxOption, makePdfOption, makeTexOption } from './options';

export function makeTempOption() {
  return new Option(
    '--temp',
    'Delete the _build/temp folder where intermediate build artifacts are saved',
  ).default(false);
}

export function makeExportsOption() {
  return new Option(
    '--exports',
    'Delete the entire _build/exports folder where exports are saved by default',
  ).default(false);
}

export function makeCleanCLI(program: Command) {
  const command = new Command('clean')
    .description('Clean built pdf, tex, and word exports and other build artifacts')
    .argument('[files...]', 'list of files to clean corresponding outputs')
    .addOption(makePdfOption())
    .addOption(makeTexOption())
    .addOption(makeDocxOption())
    .addOption(makeTempOption())
    .addOption(makeExportsOption())
    .action(clirun(Session, clean, program));
  return command;
}
