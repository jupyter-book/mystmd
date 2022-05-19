import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import inquirer from 'inquirer';
import { ISession } from '../session/types';
import { addProjectsToConfig } from './add';
import { blankCurvenoteConfig, CURVENOTE_YML } from '../config';
import { docLinks } from '../docs';
import { MyUser } from '../models';
import { writeFileToFolder } from '../utils';
import { serve } from '../web';
import { LOGO } from '../web/public';
import { pullProjects } from './pull';
import questions from './questions';
import { LogLevel } from '../logging';

type Options = {
  template: string;
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

export async function init(session: ISession, opts: Options) {
  if (session.config) {
    session.log.error(`We found a "${CURVENOTE_YML}" on your path, please edit that instead!\n\n`);
    session.log.info(
      `${chalk.dim('Are you looking for')} ${chalk.bold('curvenote sync add')}${chalk.dim('?')}`,
    );
    return;
  }
  const pwd = fs.readdirSync('.');
  const folderIsEmpty = pwd.length === 0;

  session.log.info(await WELCOME(session));

  // Load the user now, and wait for it below!
  let me: MyUser | Promise<MyUser> | undefined;
  if (!session.isAnon) me = new MyUser(session).get();

  const defaultName = path.basename(path.resolve());
  const config = blankCurvenoteConfig(defaultName);
  const answers = await inquirer.prompt([
    questions.name({ name: config.web.name }),
    questions.content({ folderIsEmpty, template: opts.template }),
  ]);
  if (answers.content === 'curvenote') {
    await addProjectsToConfig(session, { config, singleQuestion: true });
    session.log.info(`Add other projects using: ${chalk.bold('curvenote sync add')}\n`);
  }
  let pullComplete = false;
  const pullOpts = { config, level: LogLevel.debug };
  const pullProcess = pullProjects(session, pullOpts).then(() => {
    pullComplete = true;
  });
  // Personalize the config
  me = await me;
  config.web.name = answers.name;
  config.web.logoText = answers.name;
  if (me) {
    config.web.domains = [`${me.data.username}.curve.space`];
    config.web.twitter = me.data.twitter || undefined;
  }
  writeFileToFolder(CURVENOTE_YML, yaml.dump(config));
  session.loadConfig();
  // logo, favicon
  writeFileToFolder('public/logo.svg', LOGO);

  session.log.info(await FINISHED(session));

  const { start } = await inquirer.prompt([
    {
      name: 'start',
      message: 'Would you like to start the curve.space local server now?',
      type: 'confirm',
      default: true,
    },
  ]);
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
    await serve(session, {});
  }
  await pullProcess;
}
