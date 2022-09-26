import { Command } from 'commander';
import fs from 'fs';
import { extname } from 'path';
import yaml from 'js-yaml';
import { clirun, getSession, tic } from 'myst-cli-utils';
import type { ISession } from 'myst-cli-utils';
import { Inventory } from '../intersphinx';

export async function parseInvFile(session: ISession, path: string, output?: string) {
  const inv = new Inventory({ path });
  const toc = tic();
  await inv.load();
  session.log.debug(toc('Inventory loaded in %s'));
  if (!output) {
    session.log.info(yaml.dump(inv.data));
    return;
  }
  switch (extname(output)) {
    case '.yaml':
    case '.yml': {
      const data = yaml.dump(inv.data);
      fs.writeFileSync(output, data);
      return;
    }
    case '.json': {
      fs.writeFileSync(output, JSON.stringify(inv.data));
      return;
    }
    default:
      throw new Error('Extension for output must be .json or .yml');
  }
}

function makeParseCLI(program: Command) {
  const command = new Command('parse')
    .description('Parse a local objects.inv')
    .argument('<path>', 'A path to local objects.inv or remote URL')
    .argument('[output]', 'An output file to write to')
    .action(clirun(parseInvFile, { program, getSession }));
  return command;
}

export function addParseCLI(program: Command) {
  program.addCommand(makeParseCLI(program));
}
