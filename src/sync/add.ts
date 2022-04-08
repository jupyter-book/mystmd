import inquirer from 'inquirer';
import { join, basename } from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { docLinks } from '../docs';
import { projectIdFromLink } from '../export';
import { Project } from '../models';
import { blankCurvenoteConfig, CurvenoteConfig, CURVENOTE_YML } from '../config';
import { ISession } from '../session/types';
import { projectLogString } from './utls';
import questions from './questions';
import { pullProjects } from './pull';
import { writeFileToFolder } from '../utils';

export async function addProjectsToConfig(
  session: ISession,
  opts?: { config?: CurvenoteConfig; singleQuestion?: boolean },
): Promise<CurvenoteConfig> {
  const { config = blankCurvenoteConfig() } = opts ?? {};
  let confirm = { additional: true };
  let firstTime = true;
  while ((confirm.additional && !opts?.singleQuestion) || firstTime) {
    const { projectLink } = await inquirer.prompt([
      {
        name: 'projectLink',
        message: 'Link to Curvenote project:',
        type: 'input',
        default: 'https://curvenote.com/@templates/projects',
      },
    ]);
    session.log.info(chalk.dim('Validating link...'));
    const id = projectIdFromLink(session, projectLink);
    let project: Project;
    try {
      project = await new Project(session, id).get();
    } catch (error) {
      session.log.error('Could not load project from link.');
      if (session.isAnon) {
        session.log.info(
          `To add your own Curvenote projects, please authenticate using:\n\ncurvenote token set [token]\n\nLearn more at ${docLinks.auth}`,
        );
      }
      return config;
    }
    session.log.info(chalk.green(`🚀 Found ${projectLogString(project)}`));
    const { path } = await inquirer.prompt([
      {
        name: 'path',
        message: 'Name of local folder to sync to?',
        type: 'input',
        default: join('content', project.data.name),
      },
    ]);
    config.sync.push({
      id: project.data.id,
      folder: path,
      link: `https://curvenote.com/@${project.data.team}/${project.data.name}`,
    });
    config.web.sections.push({
      title: project.data.title,
      folder: path, // TODO: fix me!
      path,
    });
    config.web.nav.push({
      title: project.data.title,
      url: `/${basename(path)}`,
    });
    if (!opts?.singleQuestion) {
      confirm = await inquirer.prompt([
        {
          name: 'additional',
          message: 'Would you like to add additional projects now?',
          type: 'confirm',
          default: false,
        },
      ]);
    }
    firstTime = false;
  }
  return config;
}

const START = `

${chalk.bold(chalk.green('Add new content to your Curvenote project'))} 🛻

`;

const FINISHED = `

${chalk.bold(chalk.green('Content successfully added'))} 🎉

`;

export async function add(session: ISession) {
  const { config } = session;
  if (!config) throw new Error('Must have config to add content.');

  session.log.info(START);

  const answers = await inquirer.prompt([questions.content({ folderIsEmpty: true })]);

  if (answers.content === 'curvenote') {
    await addProjectsToConfig(session, { config });
  }

  writeFileToFolder(CURVENOTE_YML, yaml.dump(config));

  const { pull } = await inquirer.prompt([questions.pull()]);
  if (pull) {
    await pullProjects(session, { config });
  } else {
    session.log.info(
      `Sync your content later using:\n\n${chalk.bold('curvenote pull')}\n\nLearn more at ${
        docLinks.pull
      }`,
    );
  }

  session.log.info(FINISHED);
}
