import fs from 'fs';
import { basename, resolve } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ISession } from '../session/types';
import { CURVENOTE_YML, writeSiteConfig, writeProjectConfig } from '../newconfig';
import { docLinks } from '../docs';
import { MyUser } from '../models';
import { writeFileToFolder } from '../utils';
import { startServer } from '../web';
import { LOGO } from '../web/public';
import { pullProjects } from './pull';
import questions from './questions';
import { LogLevel } from '../logging';
import { selectors } from '../store';
import { getDefaultProjectConfig, getDefaultSiteConfig, INIT_LOGO_PATH } from './utils';
import { interactiveCloneQuestions } from './clone';

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
  let path = '.';
  // Initialize config - error if it exists
  if (
    selectors.selectLocalSiteConfig(session.store.getState()) ||
    selectors.selectLocalProjectConfig(session.store.getState(), '.')
  ) {
    throw Error(
      `The ${CURVENOTE_YML} config already exists, did you mean to ${chalk.bold(
        'curvenote add',
      )} or ${chalk.bold('curvenote start')}?`,
    );
  }
  const siteConfig = getDefaultSiteConfig(basename(resolve(path)));
  const projectConfig = getDefaultProjectConfig();

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
    projectConfig.title = title;
    siteConfig.projects = [{ path, slug: basename(resolve(path)) }];
    pullComplete = true;
  } else if (content === 'curvenote') {
    const { siteProject } = await interactiveCloneQuestions(session, { projectConfig });
    path = siteProject.path;
    siteConfig.nav = [{ title: projectConfig.title, url: `/${siteProject.slug}` }];
    siteConfig.projects = [siteProject];
    session.log.info(`Add other projects using: ${chalk.bold('curvenote clone')}\n`);
  }
  // Personalize the config
  me = await me;
  siteConfig.title = title;
  siteConfig.logoText = title;
  if (me) {
    const { username, twitter } = me.data;
    siteConfig.domains = [`${username}.curve.space`];
    if (twitter) siteConfig.twitter = twitter;
  }
  // Save the configs to the state and write them to disk
  writeSiteConfig(session.store, '.', siteConfig);
  writeProjectConfig(session.store, path, projectConfig);

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
