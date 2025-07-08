import chalk from 'chalk';
import fs from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { tic } from 'myst-cli-utils';
import type { TemplateYmlResponse } from 'myst-templates';
import {
  downloadTemplate,
  fetchPublicTemplate,
  listPublicTemplates,
  resolveInputs,
  TEMPLATE_YML,
} from 'myst-templates';
import type { ISession } from './session/types.js';

import { TemplateKind } from 'myst-common';

type TemplateKinds = {
  pdf?: boolean;
  tex?: boolean;
  typst?: boolean;
  docx?: boolean;
  site?: boolean;
};

const allTemplates = [TemplateKind.tex, TemplateKind.typst, TemplateKind.docx, TemplateKind.site];

function getKindFromName(name: string) {
  return name.match(/^(tex|typst|docx|site)\//)?.[1] ?? undefined;
}
function getKind(session: ISession, kinds?: TemplateKinds): TemplateKind[] | undefined {
  if (!kinds) return undefined;
  const { pdf, tex, typst, docx, site } = kinds;
  if (pdf) session.log.warn('PDF templates may be either "tex" or "typst", including both.');
  const flags = {
    [TemplateKind.tex]: (tex || pdf) ?? false,
    [TemplateKind.typst]: (typst || pdf) ?? false,
    [TemplateKind.docx]: docx ?? false,
    [TemplateKind.site]: site ?? false,
  };
  const filteredKinds = Object.entries(flags)
    .filter(([, v]) => !!v)
    .map(([k]) => k);
  if (!filteredKinds || filteredKinds.length === 0) return undefined;
  return filteredKinds as TemplateKind[];
}

export async function downloadTemplateCLI(
  session: ISession,
  template: string,
  path?: string,
  opts?: TemplateKinds & { force?: true },
) {
  const templateKind = getKindFromName(template);
  const kinds = templateKind ? [templateKind] : getKind(session, opts);
  if (!kinds?.length) {
    throw new Error('Cannot lookup a template without specifying a kind (e.g. typst).');
  }

  if (kinds.length > 1) {
    throw new Error('Cannot lookup a template when more than one kind is specified.');
  }
  const kind = kinds[0] as TemplateKind;
  const { templatePath: defaultTemplatePath, templateUrl } = resolveInputs(session, {
    template,
    kind,
    buildDir: session.buildPath(),
  });
  const templatePath = path || defaultTemplatePath;
  if (!templateUrl) {
    throw new Error(`Unresolved template URL for "${template}"`);
  }
  if (fs.existsSync(templatePath)) {
    if (!opts?.force) {
      session.log.error(`The template download path already exists: "${templatePath}"`);
      process.exit(1);
    }
    session.log.info(`🗑  Deleting path ${templatePath} due to "force" option`);
    fs.rmSync(templatePath, { recursive: true });
  }
  await downloadTemplate(session, { templatePath, templateUrl });
}

export async function listTemplatesCLI(
  session: ISession,
  name?: string,
  opts?: { tag?: string } & TemplateKinds,
) {
  const toc = tic();
  const kinds = getKind(session, opts);
  if (name) {
    if (kinds && kinds?.length > 1) {
      throw new Error('Cannot lookup a template with more than one kind.');
    }
    const isLocal = fs.existsSync(name)
      ? name.endsWith('.yml')
        ? name
        : join(name, TEMPLATE_YML)
      : false;
    // Load the template from disk or remotely
    const template = isLocal
      ? (yaml.load(fs.readFileSync(isLocal).toString()) as TemplateYmlResponse)
      : await fetchPublicTemplate(session, name, kinds?.[0]);
    if (!template.id) template.id = name;
    session.log.debug(toc(`Found ${template.id} template in %s`));
    session.log.info(
      `${chalk.bold.green((template.title ?? '').padEnd(30))}${chalk.bold.blueBright(
        template.id.replace(/^(tex|typst|site|docx)\//, '').replace(/^myst\//, ''),
      )}`,
    );
    session.log.info(
      `ID: ${chalk.dim(template.id)}\nVersion: ${chalk.dim(template.version ?? '')}`,
    );
    session.log.info(
      `Authors: ${chalk.dim(template.authors?.map((a) => a.name).join(', ') ?? '')}`,
    );
    session.log.info(`Description: ${chalk.dim(template.description ?? '')}`);
    session.log.info(`Tags: ${chalk.dim(template.tags?.join(', ') ?? '')}`);
    session.log.info(chalk.bold.blueBright(`\nParts:`));
    template.parts?.map((p) =>
      session.log.info(
        `${chalk.cyan(p.id)}${p.required ? chalk.dim(' (required)') : ''} - ${p.description
          ?.trim()
          .replace(/\n/g, '\n\t')}`,
      ),
    );
    session.log.info(chalk.bold.blueBright(`\nOptions:`));
    template.options?.map((p) =>
      session.log.info(
        `${chalk.cyan(p.id)} (${p.type})${
          p.required ? chalk.dim(' (required)') : ''
        } - ${p.description?.trim().replace(/\n/g, '\n\t')}`,
      ),
    );
    return;
  }
  const templates = await listPublicTemplates(session, kinds ?? allTemplates);
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
  if (filtered.length === 0) {
    session.log.error(
      `No templates found for kinds "${(kinds ?? allTemplates).join(', ')}"${
        opts?.tag ? ` and tag "${opts.tag}"` : ''
      }`,
    );
    process.exit(1);
  }
  filtered.forEach((template) => {
    session.log.info(
      `\n${chalk.bold.green((template.title ?? '').padEnd(30))}${chalk.bold.blueBright(
        template.id.replace(/^(tex|typst|site|docx)\//, '').replace(/^myst\//, ''),
      )}\nDescription: ${chalk.dim(template.description ?? '')}\nTags: ${chalk.dim(
        template.tags?.join(', ') ?? '',
      )}`,
    );
  });
}
