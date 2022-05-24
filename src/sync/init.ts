import fs from 'fs';
import { basename, join, resolve } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ISession } from '../session/types';
import {
  CURVENOTE_YML,
  saveProjectConfig,
  saveSiteConfig,
  writeSiteConfig,
  writeProjectConfig,
} from '../newconfig';
import { docLinks } from '../docs';
import { MyUser } from '../models';
import { writeFileToFolder } from '../utils';
import { startServer } from '../web';
import { LOGO } from '../web/public';
import { pullProjects, validateProject } from './pull';
import questions from './questions';
import { LogLevel } from '../logging';
import { ProjectConfig, SiteConfig } from '../types';
import { config } from '../store/local';

type Options = {
  branch?: string;
  force?: boolean;
};

const WELCOME = async (session: ISession) => `

${chalk.bold.green('Welcome to the Curvenote CLI!!')} 👋

${chalk.bold('curvenote init')} walks you through creating a ${chalk.bold(CURVENOTE_YML)} file.

You can use this client library to:

 - ${chalk.bold('sync content')} to & from Curvenote
 - ${chalk.bold('build & export')} professional PDFs
 - create a ${chalk.bold('local website')} & deploy to ${chalk.blue(
  `https://${
    session.isAnon ? 'your' : (await new MyUser(session).get()).data.username
  }.curve.space`,
)}

Find out more here:
${docLinks.overview}

`;

const FINISHED = async (session: ISession) => `

${chalk.bold(chalk.green('Curvenote setup is complete!!'))} 🚀

You can use this client library to:

  - ${chalk.bold('curvenote pull')}: Update your content to what is on https://curvenote.com
  - ${chalk.bold('curvenote start')}: Start a local web server now!
  - ${chalk.bold('curvenote deploy')}: Share content on ${chalk.blue(
  `https://${
    session.isAnon ? 'your' : (await new MyUser(session).get()).data.username
  }.curve.space`,
)}

Find out more here:
${docLinks.overview}

`;

const INIT_LOGO_PATH = join('public', 'logo.svg');

const INIT_SITE_CONFIG: SiteConfig = {
  title: 'My Curve Space',
  domains: [],
  logo: INIT_LOGO_PATH,
  logoText: 'My Curve Space',
  nav: [],
  actions: [{ title: 'Learn More', url: docLinks.curvespace }],
  projects: [],
};

const INIT_PROJECT_CONFIG: ProjectConfig = {
  title: 'my-project',
};

/**
 * Initialize local curvenote project from folder or remote project
 *
 * It creates a new curvenote.yml file in the current directory with
 * both site and project configuration.
 *
 * This fails if curvenote.yml already exists; use `start` or `add`.
 */
export async function init(session: ISession, opts: Options) {
  session.log.info(await WELCOME(session));
  const path = '.';
  let siteConfig;
  let projectConfig;
  // Initialize config - error if it exists
  try {
    siteConfig = saveSiteConfig(session.store, INIT_SITE_CONFIG, true);
    projectConfig = saveProjectConfig(session.store, path, INIT_PROJECT_CONFIG, true);
  } catch (err) {
    session.log.error(err);
    return;
  }

  if (!siteConfig || !projectConfig) throw Error('Error initializing configs');

  // Load the user now, and wait for it below!
  let me: MyUser | Promise<MyUser> | undefined;
  if (!session.isAnon) me = new MyUser(session).get();

  const folderIsEmpty = fs.readdirSync(path).length === 0;
  const { title, content } = await inquirer.prompt([
    questions.title({ title: siteConfig.title || '' }),
    questions.content({ folderIsEmpty }),
  ]);
  let pullComplete = false;
  if (content === 'folder') {
    session.store.dispatch(
      config.actions.receiveSiteMetadata({ projects: [{ path, slug: basename(resolve(path)) }] }),
    );
    pullComplete = true;
  } else if (content === 'curvenote') {
    const { projectLink } = await inquirer.prompt([questions.projectLink()]);
    const project = await validateProject(session, projectLink);
    if (!project) return;
    session.store.dispatch(
      config.actions.receiveProjectMetadata({ remote: project.data.id, path }),
    );
    session.store.dispatch(
      config.actions.receiveSiteMetadata({ projects: [{ path, slug: project.data.name }] }),
    );
    session.log.info(`Add other projects using: ${chalk.bold('curvenote sync add')}\n`);
  }
  // Personalize the config
  me = await me;
  session.store.dispatch(
    config.actions.receiveSiteMetadata({
      title,
      logoText: title,
      twitter: siteConfig.twitter || me?.data.twitter,
    }),
  );
  if (me && !siteConfig.domains.length) {
    session.store.dispatch(
      config.actions.receiveSiteMetadata({
        domains: [`${me.data.username}.curve.space`],
      }),
    );
  }
  const state = session.store.getState();
  writeSiteConfig(state, path);
  writeProjectConfig(state, path);

  const pullOpts = { level: LogLevel.debug };
  let pullProcess: Promise<void> | undefined;
  if (!pullComplete) {
    pullProcess = pullProjects(session, pullOpts).then(() => {
      pullComplete = true;
    });
  }

  if (siteConfig.logo === INIT_LOGO_PATH) {
    writeFileToFolder(INIT_LOGO_PATH, LOGO);
  }

  session.log.info(await FINISHED(session));

  const { start } = await inquirer.prompt([questions.start()]);
  if (!start) {
    session.log.info(chalk.dim('\nYou can do this later with:'), chalk.bold('curvenote start'));
  }
  if (!pullComplete) {
    pullOpts.level = LogLevel.info;
    session.log.info(
      `${chalk.dim('\nFinishing')} ${chalk.bold('curvenote pull')}${chalk.dim(
        '. This may take a minute ⏳...',
      )}`,
    );
  }
  if (start) {
    await pullProcess;
    session.log.info(chalk.dim('\nStarting local server with: '), chalk.bold('curvenote start'));
    await startServer(session, opts);
  }
  await pullProcess;
}
