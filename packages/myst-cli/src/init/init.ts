import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { v4 as uuid } from 'uuid';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { defaultConfigFile, loadConfig, writeConfigs } from '../config.js';
import { loadProjectFromDisk } from '../project/load.js';
import { selectors } from '../store/index.js';
import type { ISession } from '../session/types.js';
import { startServer } from '../build/site/start.js';
import { githubCurvenoteAction, githubPagesAction } from './gh-actions/index.js';
import { getGithubUrl } from '../utils/github.js';
import { checkFolderIsGit } from '../utils/git.js';
import { upgradeJupyterBook } from './jupyter-book/upgrade.js';
import { fsExists } from '../utils/fsExists.js';

const VERSION_CONFIG = '# See docs at: https://mystmd.org/guide/frontmatter\nversion: 1\n';
import { binaryName, helpURL, readableName } from '../utils/whiteLabelling.js';

function createProjectConfig({ github }: { github?: string } = {}) {
  return `project:
  id: ${uuid()}
  # title:
  # description:
  # keywords: []
  # authors: []
  ${github ? `github: ${github}` : '# github:'}
  # To autogenerate a Table of Contents, run "${binaryName()} init --write-toc"
`;
}
const SITE_CONFIG = `site:
  template: book-theme
  # options:
  #   favicon: favicon.ico
  #   logo: site_logo.png
`;

const GITIGNORE = `# ${readableName()} build outputs
/_build/`;

export type InitOptions = {
  project?: boolean;
  site?: boolean;
  writeTOC?: boolean;
  ghPages?: boolean;
  ghCurvenote?: boolean;
};

const WELCOME = () => `
${chalk.bold.yellowBright.italic(`Welcome to the ${readableName()} CLI!`)} 🎉 🚀

${chalk.bold.green(`${binaryName()} init`)} walks you through creating a ${chalk.bold.blue('myst.yml')} file.

You can use ${readableName()} to:

 - create interactive ${chalk.bold.magenta('websites')} from markdown and Jupyter Notebooks 📈
 - ${chalk.bold.magenta('build & export')} professional PDFs and Word documents 📄

Learn more about this CLI and MyST Markdown at: ${chalk.bold(helpURL())}

`;

async function gitignoreExists(): Promise<boolean> {
  try {
    await fs.promises.access('.gitignore');
    // The check succeeded
  } catch (error) {
    return false;
  }
  return true;
}

export async function init(session: ISession, opts: InitOptions) {
  const { project, site, writeTOC, ghPages, ghCurvenote } = opts;

  if (ghPages) return githubPagesAction(session);
  if (ghCurvenote) return githubCurvenoteAction(session);

  if (!project && !site && !writeTOC) {
    session.log.info(WELCOME());
  }

  // Assume we're working in the cwd
  if (await checkFolderIsGit()) {
    if (!(await gitignoreExists())) {
      session.log.info(`💾 Writing default .gitignore`);
      await fs.promises.writeFile('.gitignore', GITIGNORE);
    } else {
      // Parse the existing gitignore
      const contents = await fs.promises.readFile('.gitignore', { encoding: 'utf-8' });
      const lines = contents.split(/\r\n|\r|\n/);
      // Do we have mention of `/?_build`?
      //eslint-disable-next-line
      if (lines.some((line) => /^\/?_build([#\/].*)?$/.test(line))) {
        session.log.info(`✅ .gitignore exists and already ignores ${readableName()} outputs`);
      } else {
        session.log.info(`💾 Updating .gitignore`);
        await fs.promises.writeFile('.gitignore', `${contents}\n/_build/`);
      }
    }
  }

  await loadConfig(session, '.');
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
      await writeConfigs(session, '.', { siteConfig, projectConfig });
    }
  } else {
    // Is this a Jupyter Book?
    let didUpgrade = false;
    if (await fsExists('_config.yml')) {
      const configFile = defaultConfigFile(session, '.');
      const promptUpgrade = await inquirer.prompt([
        {
          name: 'upgrade',
          message: [
            `📘 Found a legacy Jupyter Book. To proceed, myst needs to perform an upgrade which will:
`,
            chalk.dim(`‣ Upgrade any Sphinx-style glossaries to MyST-style glossaries
‣ Upgrade any case-insensitive admonition names to lowercase (${chalk.blue('Note')} → ${chalk.blue('note')})
‣ Migrate configuration from ${chalk.blue('_config.yml')} and (if applicable) ${chalk.blue('_toc.yml')} files
‣ Rename any modified or unneeded files so that they are hidden

`),
            `Are you willing to proceed?`,
          ].join(''),
          type: 'confirm',
          default: true,
        },
      ]);
      if (!promptUpgrade.upgrade) {
        return;
      }
      session.log.info(`💾 Writing new config file: ${chalk.blue(path.resolve(configFile))}`);
      try {
        await upgradeJupyterBook(session, configFile);
        didUpgrade = true;
      } catch (err) {
        session.log.error(`❌ An error occurred during Jupyter Book upgrade:\n\n${err}\n\n`);
        session.log.warn(`Ignoring Jupyter Book configuration!`);
      }
    }
    // Otherwise, write some default configs
    if (!didUpgrade) {
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
  }
  if (writeTOC) {
    await loadConfig(session, '.');
    await loadProjectFromDisk(session, '.', { writeTOC });
  }
  // If we have any options, this command is complete!
  if (writeTOC || project || site) return;
  session.log.info(''); // New line
  const promptStart = await inquirer.prompt([
    {
      name: 'start',
      message: `Would you like to run ${chalk.green(`${binaryName()} start`)} now?`,
      type: 'confirm',
      default: true,
    },
  ]);
  if (!promptStart.start) {
    session.log.info(
      chalk.dim(`\nYou can start the ${readableName()} web server later with:`),
      chalk.bold(`${binaryName()} start`),
      chalk.dim('\nYou can build all content with:'),
      chalk.bold(`${binaryName()} build --all`),
    );
    return;
  }
  await startServer(session, {});
}
