import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { defaultConfigFile, loadConfigAndValidateOrThrow, writeConfigs } from '../config.js';
import { loadProjectFromDisk } from '../project/index.js';
import { selectors } from '../store/index.js';
import type { ISession } from '../session/index.js';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { startServer } from './site/start.js';
import { makeExecutable } from 'myst-cli-utils';

const VERSION_CONFIG = '# See docs at: https://mystmd.org/guide/frontmatter\nversion: 1\n';

function createProjectConfig({ github }: { github?: string } = {}) {
  return `project:
  # title:
  # description:
  keywords: []
  authors: []
  ${github ? `github: ${github}` : '# github:'}
  # bibliography: []
`;
}
const SITE_CONFIG = `site:
  template: book-theme
  # title:
  # logo:
  nav: []
  actions:
    - title: Learn More
      url: https://mystmd.org/guide
  domains: []
`;

export type InitOptions = {
  project?: boolean;
  site?: boolean;
  writeToc?: boolean;
};

const WELCOME = () => `
${chalk.bold.yellowBright.italic('Welcome to the MyST Markdown CLI!!')} 🎉 🚀

${chalk.bold.green('myst init')} walks you through creating a ${chalk.bold.blue('myst.yml')} file.

You can use myst to:

 - create interactive ${chalk.bold.magenta('websites')} from markdown and Jupyter Notebooks 📈
 - ${chalk.bold.magenta('build & export')} professional PDFs and Word documents 📄

Learn more about this CLI and MyST Markdown at: ${chalk.bold('https://mystmd.org')}

`;

async function getGithubUrl() {
  try {
    const gitUrl = await makeExecutable('git config --get remote.origin.url', null)();
    if (!gitUrl.includes('github.com')) return undefined;
    return gitUrl.replace('git@github.com:', 'https://github.com/').replace('.git', '').trim();
  } catch (error) {
    return undefined;
  }
}

export async function init(session: ISession, opts: InitOptions) {
  const { project, site, writeToc } = opts;
  if (!project && !site && !writeToc) {
    session.log.info(WELCOME());
  }
  loadConfigAndValidateOrThrow(session, '.');
  const state = session.store.getState();
  const existingRawConfig = selectors.selectLocalRawConfig(state, '.');
  const existingProjectConfig = selectors.selectLocalProjectConfig(state, '.');
  const existingSiteConfig = selectors.selectLocalSiteConfig(state, '.');
  const existingConfigFile = selectors.selectLocalConfigFile(state, '.');
  const github = await getGithubUrl();
  if (existingRawConfig) {
    // If config file is already present, update it.
    let projectConfig: Record<string, any> | undefined;
    let siteConfig: Record<string, any> | undefined;
    if (project || (!site && !project)) {
      if (existingProjectConfig) {
        session.log.info(`✅ Project already initialized with config file: ${existingConfigFile}`);
      } else {
        projectConfig = (yaml.load(createProjectConfig({ github })) as Record<string, any>).project;
      }
    }
    if (site || (!site && !project)) {
      if (existingSiteConfig) {
        session.log.info(`✅ Site already initialized with config file: ${existingConfigFile}`);
      } else {
        siteConfig = (yaml.load(SITE_CONFIG) as Record<string, any>).site;
      }
    }
    if (siteConfig || projectConfig) {
      session.log.info(`💾 Updating config file: ${existingConfigFile}`);
      writeConfigs(session, '.', { siteConfig, projectConfig });
    }
  } else {
    // If no config is present, write it explicitly to include comments.
    const configFile = defaultConfigFile(session, '.');
    let configData: string;
    let configDoc: string;
    if (site && !project) {
      configData = `${VERSION_CONFIG}${SITE_CONFIG}`;
      configDoc = 'site';
    } else if (project && !site) {
      configData = `${VERSION_CONFIG}${createProjectConfig({ github })}`;
      configDoc = 'project';
    } else {
      configData = `${VERSION_CONFIG}${createProjectConfig({ github })}${SITE_CONFIG}`;
      configDoc = 'project and site';
    }
    session.log.info(
      `💾 Writing new ${configDoc} config file: ${chalk.blue(path.resolve(configFile))}`,
    );
    fs.writeFileSync(configFile, configData);
  }
  if (writeToc) {
    loadConfigAndValidateOrThrow(session, '.');
    await loadProjectFromDisk(session, '.', { writeToc });
  }
  // If we have any options, this command is complete!
  if (writeToc || project || site) return;
  session.log.info(''); // New line
  const promptStart = await inquirer.prompt([
    {
      name: 'start',
      message: `Would you like to run ${chalk.green('myst start')} now?`,
      type: 'confirm',
      default: true,
    },
  ]);
  if (!promptStart.start) {
    session.log.info(
      chalk.dim('\nYou can start the myst web server later with:'),
      chalk.bold('myst start'),
      chalk.dim('\nYou can build all content with:'),
      chalk.bold('myst build --all'),
    );
    return;
  }
  await startServer(session, {});
}
