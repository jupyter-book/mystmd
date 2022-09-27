import chalk from 'chalk';
import { Command } from 'commander';
import yaml from 'js-yaml';
import fs from 'fs';
import { join, sep, extname } from 'path';
import type { ISession } from '../types';
import type { ValidationOptions } from 'simple-validators';
import { PAGE_FRONTMATTER_KEYS } from 'myst-frontmatter';
import { RENDERER_DOC_KEYS } from '../types';
import { validateTemplateYml } from '../validators';
import { clirun } from 'myst-cli-utils';
import { getSession } from '../session';

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

function findDuplicates<T extends string | number>(list: T[]): T[] {
  const duplicates: T[] = [];
  list.reduce((s, e) => {
    if (s.has(e)) {
      duplicates.push(e);
    }
    s.add(e);
    return s;
  }, new Set<T>());
  return duplicates;
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

export function checkTemplate(session: ISession, path: string, opts?: { fix?: boolean }) {
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

  if (configYaml.jtex !== 'v1') {
    messages.errors.push({
      property: 'jtex',
      message: 'The template.yml must have a "jtex: v1" version.',
    });
    configYaml = { jtex: 'v1', ...configYaml };
  }

  const validated = validateTemplateYml(configYaml, { property: '', messages, templateDir });

  if (!validated) {
    printWarnings(session, 'template.yml', messages);
    throw new Error('Could not validate template.yml');
  }
  // These are not strictly required, but should be included
  ['title', 'description', 'version', 'license', 'thumbnail'].forEach((p) => {
    if (validated[p as keyof typeof validated]) return;
    messages.warnings.push({
      property: p,
      message: `The template.yml should include "${p}"`,
    });
  });
  // Check that the thumbnail exists if listed
  if (validated.thumbnail && !fs.existsSync(join(templateDir, validated.thumbnail))) {
    messages.warnings.push({
      property: 'thumbnail',
      message: `The thumbnail "${validated.thumbnail}" does not exist`,
    });
  }

  // Log all the config warnings for the template.yml
  const configWarnings = printWarnings(session, 'template.yml', messages);

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

  // Validate options
  const options = validated.options?.map((p) => p.id) ?? [];
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

  // Validate doc
  const doc = validated.doc?.map((p) => p.id) ?? [];
  const extraDocOptions: { id: string }[] = [];
  Object.entries(variables.doc).forEach(([optKey, lineNumbers]) => {
    if (!doc.includes(optKey) && PAGE_FRONTMATTER_KEYS.includes(optKey)) {
      messages.errors.push({
        property: 'doc',
        message: `The template.yml does not include document property "${optKey}" but it is referenced in template.tex on ${lineNumbersToString(
          lineNumbers,
        )}`,
      });
      extraDocOptions.push({ id: optKey });
      return;
    }
    if (!RENDERER_DOC_KEYS.includes(optKey)) {
      messages.errors.push({
        property: 'doc',
        message: `The template.yml references "doc.${optKey}" but that is not a valid document property on ${lineNumbersToString(
          lineNumbers,
        )}`,
      });
      return;
    }
  });

  // Validate packages
  if (!validated.packages || validated.packages.length === 0) {
    messages.errors.push({
      property: 'packages',
      message: 'The packages should be included with a list of all packages used in the template',
    });
  }

  const allPackages = new Set(validated.packages);
  const fixedPackages = new Set(validated.packages);
  if (validated.packages && allPackages.size !== validated.packages?.length) {
    const duplicates = findDuplicates(validated.packages);
    messages.errors.push({
      property: 'packages',
      message: `There are duplicate packages listed: "${duplicates.join(', ')}"`,
    });
  }
  const templateWarnings = printWarnings(session, 'template.tex', messages);

  const knownFileTypes = new Set(['.cls', '.def', '.sty']);
  const maybeExtraFiles = fs.readdirSync(templateDir).filter((f) => knownFileTypes.has(extname(f)));
  const fixedFiles = [];
  if (
    !validated.files ||
    validated.files.length === 0 ||
    validated.files.indexOf('template.tex') === -1
  ) {
    // Validate files
    messages.errors.push({
      property: 'files',
      message: 'The files array must be a list with at least the "template.tex" in it.',
    });
    fixedFiles.push('template.tex', ...maybeExtraFiles);
  }
  const packageErrors =
    validated.files
      ?.map((file, i) => {
        if (file.split(sep).length > 1) {
          messages.errors.push({
            property: `files.${i}`,
            message: `The file "${file}" must be in the same directory as the main template.`,
          });
        }
        let packages;
        if (!fs.existsSync(file)) return true;
        const fileContents = fs.readFileSync(join(templateDir, file)).toString();
        switch (extname(file)) {
          case '.cls':
          case '.tex':
          case '.def':
          case '.sty':
            packages = extractVariablesFromTemplate(fileContents).packages;
            break;
          default:
            break;
        }
        if (!packages) {
          return printWarnings(session, file, messages);
        }
        // Validate packages
        Object.entries(packages).forEach(([packageName, lineNumbers]) => {
          const lnos = lineNumbersToString(lineNumbers);
          if (lineNumbers.length > 1) {
            session.log.debug(
              `The package "${packageName}" is imported ${lineNumbers.length} times on ${lnos} in ${file}`,
            );
          }
          if (!allPackages.has(packageName)) {
            messages.warnings.push({
              property: `files.${i}.packages`,
              message: `The file "${file}" includes "${packageName}" on ${lnos}, but that is not listed in the packages.`,
            });
          }
          fixedPackages.add(packageName);
        });
        return printWarnings(session, file, messages);
      })
      ?.reduce((a, b) => a || b, false) ?? true;

  const fileWarnings = printWarnings(session, 'template.tex', messages);

  if (opts?.fix) {
    configYaml.jtex = 'v1';
    if (!configYaml.doc) {
      configYaml.doc = extraDocOptions;
    } else {
      configYaml.doc.push(...extraDocOptions);
    }
    if (!configYaml.files || configYaml.files?.length === 0) {
      configYaml.files = fixedFiles;
    }
    configYaml.packages = [...fixedPackages].sort();
    fs.writeFileSync(templateYmlPath, yaml.dump(configYaml));
  }
  if (configWarnings || templateWarnings || packageErrors || fileWarnings) {
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
    .option('--fix', 'Attempt to fix the template.yml by adding document options or packages.')
    .action(clirun(checkTemplate, { program, getSession }));
  return command;
}

function makeListPackagesCLI(program: Command) {
  const command = new Command('parse')
    .description('Parse jtex variables and packages defined in a template')
    .argument('<path>', 'A latex file to check')
    .action(clirun(listVariablesTemplate, { program, getSession }));
  return command;
}

export function addCheckCLI(program: Command) {
  program.addCommand(makeCheckCLI(program));
  program.addCommand(makeListPackagesCLI(program));
}
