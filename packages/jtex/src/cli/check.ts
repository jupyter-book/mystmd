import chalk from 'chalk';
import { Command } from 'commander';
import yaml from 'js-yaml';
import { clirun } from './utils';
import fs from 'fs';
import { join } from 'path';
import type { ISession } from '../types';
import type { ValidationOptions } from '@curvenote/validators';
import { PAGE_FRONTMATTER_KEYS } from '@curvenote/frontmatter';
import { REDERER_DOC_KEYS } from '../types';
import { validateTemplateConfig } from '../validators';

type Variables = Record<
  'options' | 'doc' | 'parts' | 'packages' | 'global',
  Record<string, number[]>
>;

function matchOpts(line: string, lineNumber: number, variables: Variables) {
  const match = line.match(/\[[#|-]-?([^\]#]*)-?[#|-]\]/g);
  if (!match) return;
  match.forEach((template) => {
    const global = template.match(/(CONTENT|IMPORTS)/g);
    if (global) {
      const value = global[0];
      if (!variables.global?.[value]) variables.global[value] = [];
      if (!variables.global[value].includes(lineNumber)) {
        variables.global[value].push(lineNumber);
      }
      return;
    }
    const args = template.match(/(doc|options|parts)\.([a-zA-Z0-9_]+)/g);
    if (!args) return;
    args.forEach((a) => {
      const [kind, value] = a.split('.');
      const useKind = kind as keyof typeof variables;
      if (!variables[useKind]?.[value]) variables[useKind][value] = [];
      if (!variables[useKind][value].includes(lineNumber)) {
        variables[useKind][value].push(lineNumber);
      }
    });
  });
}

function lineNumbersToString(lineNumbers: number[]): string {
  return `line${lineNumbers.length > 1 ? 's' : ''} ${lineNumbers.join(', ')}`;
}

function extractVariablesFromTemplate(template: string) {
  const variables: Variables = {
    options: {},
    doc: {},
    parts: {},
    packages: {},
    global: {},
  };
  template.split('\n').forEach((line: string, i: number) => {
    matchOpts(line, i + 1, variables);
  });
  template
    .split('\n')
    .map((line) => line.split(/(?<!\\)%/)[0]) // Strip comments (backwards lookup for \% escapes)
    .map((line: string, i) => {
      const match = line.match(
        /\\(?:usepackage|RequirePackage)(?:\[(?:[^\]]+)\])?\{([a-zA-z0-9_\-,\s]+)\}/g,
      );
      if (!match) return [];
      return { match, lineNumber: i + 1 };
    })
    .flat()
    .filter((m) => !!m)
    .forEach((p) => {
      const names = /\{([a-zA-z0-9_\-,\s]+)\}/.exec(p.match[0])?.[1];
      if (!names) return;
      names.split(',').forEach((n) => {
        const name = n.trim();
        if (!variables.packages?.[name]) variables.packages[name] = [];
        if (!variables.packages[name].includes(p.lineNumber)) {
          variables.packages[name].push(p.lineNumber);
        }
      });
    });
  return variables;
}

function printWarnings(
  session: ISession,
  name: string,
  messages: Required<ValidationOptions['messages']>,
) {
  if (messages.errors.length === 0 && messages.warnings.length === 0) return false;
  session.log.info(`${name}`);

  messages.warnings?.forEach((e) => {
    session.log.warn(`  [${e.property}] ${e.message}`);
  });
  messages.errors?.forEach((e) => {
    session.log.error(`  [${e.property}] ${e.message}`);
  });
  messages.warnings = [];
  messages.errors = [];
  return true;
}

export function checkTemplate(session: ISession, path: string) {
  const templateDir = path || '.';
  if (!fs.statSync(templateDir).isDirectory()) {
    throw new Error('The template path must be a directory.');
  }
  const templatePath = join(templateDir, 'template.tex');
  const templateYmlPath = join(templateDir, 'template.yml');
  if (!fs.existsSync(templatePath)) throw new Error('The template.tex file must exist.');
  if (!fs.existsSync(templateYmlPath)) throw new Error('The template.yml file must exist.');
  const template = fs.readFileSync(templatePath).toString();
  const variables = extractVariablesFromTemplate(template);
  const configText = fs.readFileSync(templateYmlPath).toString();
  let configYaml;
  try {
    configYaml = yaml.load(configText) as any;
  } catch (error) {
    throw new Error('Could not load template.yml as YAML');
  }

  const messages: Required<ValidationOptions['messages']> = { warnings: [], errors: [] };
  const validated = validateTemplateConfig(configYaml?.config, { property: '', messages });

  const configWarnings = printWarnings(session, 'template.yml', messages);
  if (!validated) {
    throw new Error('Could not validate template.yml');
  }
  // Validate global
  if (!variables.global.IMPORTS) {
    messages.errors?.push({
      property: 'global',
      message: `The global variable "IMPORTS" was not referenced in the template.`,
    });
  }
  if (!variables.global.CONTENT) {
    messages.errors?.push({
      property: 'global',
      message: `The global variable "CONTENT" was not referenced in the template.`,
    });
  }

  // Validate parts
  const parts = validated.parts?.map((p) => p.id) ?? [];
  const usedParts: string[] = [];
  Object.entries(variables.parts).forEach(([partKey, lineNumbers]) => {
    if (!parts.includes(partKey)) {
      const lines = `line${lineNumbers.length > 1 ? 's' : ''} ${lineNumbers.join(', ')}`;
      messages.errors.push({
        property: 'parts',
        message: `The template.yml does not include part "${partKey}" but it is referenced in template.tex on ${lines}`,
      });
      return;
    }
    if (!usedParts.includes(partKey)) usedParts.push(partKey);
  });
  if (parts.length > usedParts.length) {
    const unusedParts = parts.filter((p) => !usedParts.includes(p)).join('", "');
    messages.warnings?.push({
      property: 'parts',
      message: `The following parts were not referenced in the template: "${unusedParts}"`,
    });
  }

  // Validate non-frontmatter options
  const options = validated.options?.filter((p) => p.type !== 'frontmatter').map((p) => p.id) ?? [];
  const usedOpts: string[] = [];
  Object.entries(variables.options).forEach(([optKey, lineNumbers]) => {
    if (!options.includes(optKey)) {
      messages.errors.push({
        property: 'options',
        message: `The template.yml does not include option "${optKey}" but it is referenced in template.tex on ${lineNumbersToString(
          lineNumbers,
        )}`,
      });
      return;
    }
    if (!usedOpts.includes(optKey)) usedOpts.push(optKey);
  });
  if (options.length > usedOpts.length) {
    const unusedOpts = options.filter((p) => !usedOpts.includes(p)).join('", "');
    messages.warnings?.push({
      property: 'options',
      message: `The following options were not referenced in the template: "${unusedOpts}"`,
    });
  }

  // Validate non-frontmatter options
  const doc = validated.options?.filter((p) => p.type === 'frontmatter').map((p) => p.id) ?? [];
  Object.entries(variables.doc).forEach(([optKey, lineNumbers]) => {
    if (!doc.includes(optKey) && PAGE_FRONTMATTER_KEYS.includes(optKey)) {
      messages.errors.push({
        property: 'doc',
        message: `The template.yml does not include document property "${optKey}" but it is referenced in template.tex on ${lineNumbersToString(
          lineNumbers,
        )}`,
      });
      return;
    }
    if (!REDERER_DOC_KEYS.includes(optKey)) {
      messages.errors.push({
        property: 'doc',
        message: `The template.yml references "doc.${optKey}" but that is not a valid document property on ${lineNumbersToString(
          lineNumbers,
        )}`,
      });
      return;
    }
  });
  Object.entries(variables.packages).forEach(([packageName, lineNumbers]) => {
    if (lineNumbers.length > 1) {
      messages.warnings.push({
        property: 'packages',
        message: `The package "${packageName}" is imported ${
          lineNumbers.length
        } times on ${lineNumbersToString(lineNumbers)}`,
      });
      return;
    }
  });
  const templateWarnings = printWarnings(session, 'template.tex', messages);

  if (configWarnings || templateWarnings) {
    throw new Error('jtex found warnings or errors in validating your template.');
  }
}

export function listVariablesTemplate(session: ISession, file: string) {
  const templatePath = fs.statSync(file ?? '.').isDirectory()
    ? join(file ?? '.', 'template.tex')
    : file || 'template.tex';
  if (!fs.existsSync(templatePath)) throw new Error('The template.tex file must exist.');
  const template = fs.readFileSync(templatePath).toString();
  const variables = extractVariablesFromTemplate(template);
  function logEntries(entries: Record<string, number[]>) {
    Object.entries(entries).forEach(([k, lineNumbers]) => {
      session.log.info(`${k.padEnd(30)}${chalk.dim(lineNumbersToString(lineNumbers))}`);
    });
  }
  session.log.info(`${chalk.bold.blueBright('Global:')}`);
  logEntries(variables.global);
  session.log.info(`\n\n${chalk.bold.blueBright('Doc:')}`);
  logEntries(variables.doc);
  session.log.info(`\n\n${chalk.bold.blueBright('Options:')}`);
  logEntries(variables.options);
  session.log.info(`\n\n${chalk.bold.blueBright('Parts:')}`);
  logEntries(variables.parts);
  session.log.info(`\n\n${chalk.bold.blueBright('Packages:')}`);
  logEntries(variables.packages);
}

function makeCheckCLI(program: Command) {
  const command = new Command('check')
    .description('Check that a template passes validation')
    .argument('[path]', 'Path to the template directory')
    .action(clirun(checkTemplate, { program }));
  return command;
}

function makeListPackagesCLI(program: Command) {
  const command = new Command('parse')
    .description('Parse jtex variables and packages defined in a template')
    .argument('<path>', 'A latex file to check')
    .action(clirun(listVariablesTemplate, { program }));
  return command;
}

export function addCheckCLI(program: Command) {
  program.addCommand(makeCheckCLI(program));
  program.addCommand(makeListPackagesCLI(program));
}
