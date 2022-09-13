import { Command } from 'commander';
import { clirun } from './utils';
import type { ISession } from '../types';
import {
  downloadAndUnzipTemplate,
  fetchPublicTemplate,
  listPublicTemplates,
  resolveInputs,
} from '../download';
import chalk from 'chalk';
import { tic } from '../utils';

export async function downloadTemplateCLI(session: ISession, template: string, path: string) {
  const { templatePath, templateUrl } = resolveInputs(session, { template, path });
  if (!templateUrl) {
    throw new Error(`Unresolved template URL for "${template}"`);
  }
  await downloadAndUnzipTemplate(session, { templatePath, templateUrl });
}

export async function listTemplatesCLI(session: ISession, name?: string, opts?: { tag?: string }) {
  const toc = tic();
  if (name) {
    const template = await fetchPublicTemplate(session, name);
    session.log.debug(toc(`Found ${template.id} template in %s`));
    session.log.info(
      `${chalk.bold.yellowBright(template.title.padEnd(25))}${chalk.bold.blueBright(
        template.id.replace(/^public\//, ''),
      )}\nID: ${chalk.dim(template.id)}\nVersion: ${chalk.dim(
        template.version,
      )}\nAuthor: ${chalk.dim(template.author.name)}\nDescription: ${chalk.dim(
        template.description,
      )}\nTags: ${chalk.dim(template.tags.join(', '))}`,
    );
    return;
  }
  const templates = await listPublicTemplates(session, name);
  let filtered = templates;
  if (opts?.tag) {
    const tags = opts.tag.split(',').map((t) => t.trim());
    filtered = templates.filter((t) => {
      const templateTags = new Set(t.tags);
      const intersection = tags.filter((x) => templateTags.has(x));
      return intersection.length > 0;
    });
  }
  session.log.debug(
    toc(
      `Found ${templates.length} templates in %s${
        opts?.tag ? `, filtered by ${opts?.tag} to ${filtered.length}` : ''
      }`,
    ),
  );
  filtered.forEach((template) => {
    session.log.info(
      `\n${chalk.bold.yellowBright(template.title.padEnd(25))}${chalk.bold.blueBright(
        template.id.replace(/^public\//, ''),
      )}\nDescription: ${chalk.dim(template.description)}\nTags: ${chalk.dim(
        template.tags.join(', '),
      )}`,
    );
  });
}

function makeDownloadCLI(program: Command) {
  const command = new Command('download')
    .description('Download a public template to a path')
    .argument('<template>', 'The template URL or name')
    .argument('<path>', 'A folder to download and unzip the template to')
    .action(clirun(downloadTemplateCLI, { program }));
  return command;
}

function makeListCLI(program: Command) {
  const command = new Command('list')
    .description('List, filter or lookup details on public templates')
    .argument('[name]', 'The optional name to list about a specific template')
    .option(
      '--tag <tag>',
      'Any tags to filter the list by multiple tags can be joined with a comma.',
    )
    .action(clirun(listTemplatesCLI, { program }));
  return command;
}

export function addDownloadCLI(program: Command) {
  program.addCommand(makeListCLI(program));
  program.addCommand(makeDownloadCLI(program));
}
