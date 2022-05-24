import fs from 'fs';
import inquirer from 'inquirer';
import pLimit from 'p-limit';
import chalk from 'chalk';
import { projectIdFromLink, projectToJupyterBook } from '../export';
import { Project } from '../models';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { projectLogString } from './utils';
import { LogLevel, getLevel } from '../logging';
import { confirmOrExit } from '../utils';
import { selectors } from '../store';
import questions from './questions';
import { isDirectory } from '../toc';
import { docLinks } from '../docs';
import { loadProjectConfig, saveProjectConfig, writeProjectConfig } from '../newconfig';

export async function validateProject(
  session: ISession,
  projectLink: string,
): Promise<Project | undefined> {
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
    return undefined;
  }
  session.log.info(chalk.green(`🚀 Found ${projectLogString(project)}`));
  return project;
}

/**
 * Pull content for a project
 *
 * @param session the session
 * @param id the item id which is also the project id for remote content
 * @param path the local path to pull
 * @param level logging level from the cli
 */
async function pullProject(session: ISession, path: string, level?: LogLevel) {
  const state = session.store.getState();
  const projectConfig = selectors.selectLocalProjectConfig(state, path);
  if (!projectConfig) throw Error(`cannot pull project from ${path}: no project config`);
  if (!projectConfig.remote) throw Error(`cannot pull project from ${path}: no remote id`);
  const log = getLevel(session.log, level ?? LogLevel.debug);
  const project = await new Project(session, projectConfig.remote).get();
  const toc = tic();
  log(`Pulling ${path} from ${projectLogString(project)}`);
  await projectToJupyterBook(session, project.id, {
    path,
    writeConfig: false,
    createFrontmatter: true,
    titleOnlyInFrontmatter: true,
  });
  log(toc(`🚀 Pulled ${path} in %s`));
}

/**
 * Pull content for all projects in the config.sync that have remotes
 *
 * @param session
 * @param opts
 */
export async function pullProjects(session: ISession, opts: { level?: LogLevel }) {
  const state = session.store.getState();
  const siteConfig = selectors.selectLocalSiteConfig(state);
  if (!siteConfig) throw Error('cannot pull projects: no site config');
  const limit = pLimit(1);
  await Promise.all(
    siteConfig.projects.map(async (proj) => {
      limit(async () => pullProject(session, proj.path, opts.level));
    }),
  );
}

type Options = {
  yes?: boolean;
};

/** Pull a project from curvenote.com to a given path
 *
 * Prompts for project link if no project config is present, otherwise
 */
export async function pull(session: ISession, path?: string, opts?: Options) {
  path = path || '.';
  if (!fs.existsSync(path) || !isDirectory(path)) {
    session.log.error(`invalid local path: ${path}`);
  }
  let projectConfig;
  try {
    // Pull from existing remote project saved in curvenote.yml
    projectConfig = loadProjectConfig(session.store, path);
    if (!projectConfig.remote) {
      session.log.error(`Project config exists but no remote project is defined: ${path}`);
      return;
    }
  } catch {
    // Pull from new remote project
    const { projectLink } = await inquirer.prompt([
      questions.projectLink({ projectLink: 'https://curvenote.com/@templates/projects' }),
    ]);
    const project = await validateProject(session, projectLink);
    if (!project) return;
    projectConfig = { remote: project.data.id };
    saveProjectConfig(session.store, path, projectConfig);
    writeProjectConfig(session.store.getState(), path);
  }
  const message = `Pulling will overwrite all content in ${
    path === '.' ? 'the current directory' : path
  }. Are you sure?`;

  await confirmOrExit(message, opts);
  await pullProject(session, path, LogLevel.info);
}
