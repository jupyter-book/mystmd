import { Command } from 'commander';
import chalk from 'chalk';
import { clirun, getSession, tic } from 'myst-cli-utils';
import type { ISession } from 'myst-cli-utils';
import { Inventory } from '../intersphinx';

export function summarizeInvFile(session: ISession, inv: Inventory) {
  Object.entries(inv.data).forEach(([domainName, domain]) => {
    const numEntries = Object.keys(domain).length;
    session.log.info(`${chalk.yellow(domainName)} ${numEntries}`);
  });
}

export async function searchInvFile(
  session: ISession,
  path: string,
  opts?: { domain?: string; limit?: number; includes?: string; summary?: boolean },
) {
  let limit = Number.POSITIVE_INFINITY;
  if (typeof opts?.limit === 'number') {
    if (Number.isNaN(limit)) throw new Error('limit option must be a number');
    limit = opts.limit;
  }
  const search = opts?.includes?.toLowerCase();
  const inv = new Inventory({ path });
  const url = path.startsWith('http') ? `${inv.path}/` : '';
  const toc = tic();
  await inv.load();
  session.log.debug(toc('Inventory loaded in %s'));
  if (opts?.summary) {
    summarizeInvFile(session, inv);
    return;
  }
  let count = 0;
  Object.entries(inv.data).forEach(([domainName, domain]) => {
    if (
      opts?.domain &&
      !(
        // exact match or first part matches
        (
          domainName === opts.domain ||
          (!opts.domain.includes(':') && domainName.split(':')[0] === opts.domain)
        )
      )
    ) {
      return;
    }
    Object.entries(domain).forEach(([ref, { location, display }]) => {
      if (count >= limit) return;
      if (
        !search ||
        ref.toLowerCase().includes(search) ||
        location.toLowerCase().includes(search) ||
        display?.toLowerCase().includes(search)
      ) {
        session.log.info(
          `${chalk.yellow(domainName)} ${display ? chalk.blue(display) : ''} (${chalk.red.bold(
            ref,
          )})\n  ${url}${location}`,
        );
        count += 1;
      }
    });
  });
}

function makeListCLI(program: Command) {
  const command = new Command('list')
    .description('Search an objects.inv')
    .argument('<path>', 'A path to local objects.inv or remote URL')
    .option('--summary', 'Summarize the inventory')
    .option('--domain <domain>', 'Limit to a specific domain')
    .option('--includes <includes>', 'includes this search term', (n) => n.toLowerCase())
    .option('--limit <limit>', 'Limit the printing to the first n entries', (n) => Number(n))
    .action(clirun(searchInvFile, { program, getSession }));
  return command;
}

export function addSearchCLI(program: Command) {
  program.addCommand(makeListCLI(program));
}
