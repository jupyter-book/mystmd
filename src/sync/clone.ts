import fs from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ISession } from '../session/types';
import { getDefaultProjectConfig, validateLinkIsAProject } from './utils';
import { LogLevel } from '../logging';
import questions from './questions';
import { loadProjectConfigOrThrow, writeProjectConfig, writeSiteConfig } from '../newconfig';
import { pullProject } from './pull';
import { Project } from '../models';
import { ProjectConfig, SiteConfig, SiteProject } from '../types';
import { selectors } from '../store';

type Options = {
  remote?: string;
  path?: string;
  yes?: boolean;
};

export async function interactiveCloneQuestions(
  session: ISession,
  opts?: Options,
): Promise<{ siteProject: SiteProject; projectConfig: ProjectConfig }> {
  // This is an interactive clone
  let project: Project | undefined;
  if (opts?.remote) {
    project = await validateLinkIsAProject(session, opts.remote);
    if (!project) process.exit(1);
  } else {
    while (!project) {
      const { projectLink } = await inquirer.prompt([questions.projectLink()]);
      project = await validateLinkIsAProject(session, projectLink);
    }
  }
  let path = '.';
  if (opts?.path) {
    if (path !== '.' && fs.existsSync(path)) {
      throw new Error(`Invalid path for clone: "${path}", it must not exist.`);
    }
  } else {
    const { projectPath } = await inquirer.prompt([
      questions.projectPath(join('content', project.data.name)),
    ]);
    path = projectPath;
  }
  let projectConfig: ProjectConfig | undefined;
  try {
    projectConfig = loadProjectConfigOrThrow(session.store, path);
  } catch {
    // Project config does not exist; good!
    // TODO: Add all sorts of other stuff for the project data that we know!!
    projectConfig = getDefaultProjectConfig(project.data.title);
    projectConfig.remote = project.data.id;
    projectConfig.description = project.data.description || null;
    return {
      siteProject: { path, slug: project.data.name },
      projectConfig,
    };
  }
  throw new Error(
    `Project already exists: "${path}, did you mean to ${chalk.bold('curvenote pull')}`,
  );
}

/**
 * Interactively clone a project from curvenote.com to a given path
 *
 * If a site config is present, the project is also added to the site.
 */
export async function clone(
  session: ISession,
  remote?: string,
  path?: string,
  opts?: Pick<Options, 'yes'>,
) {
  // Site config is loaded on session init
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (!siteConfig) {
    session.log.debug('Site config not found');
  }
  const { siteProject, projectConfig } = await interactiveCloneQuestions(session, {
    ...opts,
    remote,
    path,
  });
  writeProjectConfig(session.store, siteProject.path, projectConfig);
  if (siteConfig) {
    const newSiteConfig: SiteConfig = {
      ...siteConfig,
      nav: [...siteConfig.nav, { title: projectConfig.title, url: `/${siteProject.slug}` }],
      projects: [...siteConfig.projects, siteProject],
    };
    writeSiteConfig(session.store, '.', newSiteConfig);
  }
  await pullProject(session, siteProject.path, { level: LogLevel.info });
}
