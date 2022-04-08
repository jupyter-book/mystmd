import inquirer from 'inquirer';
import { join } from 'path';
import chalk from 'chalk';
import { docLinks } from '../docs';
import { projectIdFromLink } from '../export';
import { Project } from '../models';
import { blankCurvenoteConfig, CurvenoteConfig } from '../config';
import { ISession } from '../session/types';
import { projectLogString } from './utls';

export async function addProjectsToConfig(
  session: ISession,
  opts?: { config?: CurvenoteConfig },
): Promise<CurvenoteConfig> {
  const { config = blankCurvenoteConfig() } = opts ?? {};
  let confirm = { additional: true };
  while (confirm.additional) {
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
    confirm = await inquirer.prompt([
      {
        name: 'additional',
        message: 'Would you like to add additional projects now?',
        type: 'confirm',
        default: false,
      },
    ]);
  }
  return config;
}
