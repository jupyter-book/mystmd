import fs from 'fs';
import inquirer from 'inquirer';
import { basename, resolve } from 'path';
import chalk from 'chalk';
import { ISession } from '../session/types';
import questions from './questions';
import { isDirectory } from '../toc';
import { loadSiteConfig, saveSiteConfig, writeSiteConfig } from '../newconfig';

const START = `

${chalk.green.bold('Add new project to your Curvenote site')} 🛻

`;

const FINISHED = `

${chalk.green.bold('Project successfully added')} 🎉

`;

/** Add local project to curve.space site config
 *
 */
export async function add(session: ISession, path?: string) {
  path = path || '.';
  if (!fs.existsSync(path) || !isDirectory(path)) {
    session.log.error(`invalid local path: ${path}`);
  }
  let siteConfig;
  try {
    siteConfig = loadSiteConfig(session.store, path);
  } catch {
    session.log.error(`site config not found in ${path === '.' ? 'current directory' : path}`);
    return;
  }
  if (!siteConfig) throw Error('site config error');

  session.log.info(START);

  const { projectPath } = await inquirer.prompt([questions.projectPath()]);
  if (!fs.existsSync(projectPath) || !isDirectory(projectPath)) {
    session.log.error(`cannot find project: ${projectPath}`);
  }
  siteConfig.projects.push({ path: projectPath, slug: basename(resolve(projectPath)) });
  saveSiteConfig(session.store, siteConfig);
  writeSiteConfig(session.store.getState(), path);

  session.log.info(FINISHED);
}
