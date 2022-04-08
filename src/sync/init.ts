import fs from 'fs';
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

type Options = {
  template: string;
};

const WELCOME = `

${chalk.bold(chalk.green('Welcome to the Curvenote CLI!!'))} 👋

${chalk.bold('curvenote init')} walks you through creating a ${chalk.bold(CURVENOTE_YML)} file.

You can use this client library to:

 - ${chalk.bold('sync content')} to & from Curvenote
 - ${chalk.bold('build & export')} professional PDFs
 - create a ${chalk.bold('local website')} & deploy to ${chalk.blue('https://your.curve.space')}

Find out more here:
${docLinks.overview}

`;

const FINISHED = `

${chalk.bold(chalk.green('Curvenote setup is complete!!'))} 🚀

You can use this client library to:

  - ${chalk.bold('curvenote start')}: Start a local web server now!
  - ${chalk.bold('curvenote deploy')}: Share content on ${chalk.blue('https://your.curve.space')}

Find out more here:
${docLinks.overview}

`;

export async function init(session: ISession, opts: Options) {
  if (session.config) {
    session.log.error(`We found a "${CURVENOTE_YML}" on your path, please edit that instead!\n\n`);
    return;
  }
  const pwd = fs.readdirSync('.');
  const folderIsEmpty = pwd.length === 0;

  session.log.info(WELCOME);

  // Load the user now, and wait for it below!
  let me: MyUser | Promise<MyUser> | undefined;
  if (!session.isAnon) me = new MyUser(session).get();

  const config = blankCurvenoteConfig();
  const answers = await inquirer.prompt([
    {
      name: 'name',
      type: 'input',
      message: 'What is the name of this space?',
      default: config.web.name,
    },
    {
      name: 'content',
      type: 'list',
      message: 'What content would you like to use?',
      when() {
        return opts.template === undefined;
      },
      choices: [
        {
          name: 'Import from Curvenote',
          value: 'curvenote',
        },
        {
          name: 'Use the content & notebooks in this folder',
          value: 'folder',
          disabled: folderIsEmpty,
        },
        {
          name: 'Show me some demo content!',
          value: 'demo',
        },
      ],
    },
  ]);
  if (answers.content === 'curvenote') {
    await addProjectsToConfig(session, { config });
  }
  const { pull } = await inquirer.prompt([
    {
      name: 'pull',
      message: 'Would you like to pull content now?',
      type: 'confirm',
      default: true,
    },
  ]);
  let pullComplete = false;
  let pullProcess: Promise<void> | undefined;
  if (pull) {
    pullProcess = pullProjects(session, { config }).then(() => {
      pullComplete = true;
    });
  } else {
    session.log.info(
      `Sync your content later using:\n\n${chalk.bold('curvenote pull')}\n\nLearn more at ${
        docLinks.pull
      }`,
    );
  }
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

  session.log.info(FINISHED);

  const { start } = await inquirer.prompt([
    {
      name: 'start',
      message: 'Would you like to install & start curve.space locally now?',
      type: 'confirm',
      default: true,
    },
  ]);
  if (!start) {
    session.log.info(chalk.dim('\nYou can do this later with:'), chalk.bold('curvenote start'));
  }
  if (!pullComplete) {
    session.log.info(chalk.dim('\nFinishing'), chalk.bold('curvenote pull'), chalk.dim('...'));
  }
  if (start) {
    await pullProcess;
    session.log.info(chalk.dim('\nStarting local server with: '), chalk.bold('curvenote start'));
    await serve(session, {});
  }
  await pullProcess;
}
