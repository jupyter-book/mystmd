import fs from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import { ISession } from '../session/types';
import { getDefaultProjectConfig, validateLinkIsAProject } from './utils';
import { LogLevel } from '../logging';
import questions from './questions';
import { loadSiteConfigOrThrow, writeProjectConfig, writeSiteConfig } from '../newconfig';
import { pullProject } from './pull';
import { Project } from '../models';
import { ProjectConfig, SiteConfig, SiteProject } from '../types';

type Options = {
  remote?: string;
  folder?: string;
  yes?: boolean;
  projectConfig?: ProjectConfig;
};

export async function interactiveCloneQuestions(
  session: ISession,
  opts?: Options,
): Promise<{ siteProject: SiteProject; projectConfig: ProjectConfig }> {
  // This is an interactive clone
  const projectConfig = opts?.projectConfig ?? getDefaultProjectConfig();
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
  // TODO: Add all sorts of other stuff for the project data that we know!!
  projectConfig.remote = project.data.id;
  projectConfig.title = project.data.title;
  projectConfig.description = project.data.description || null;
  let folder = '.';
  if (opts?.folder) {
    if (folder !== '.' && fs.existsSync(folder)) {
      throw new Error(`Invalid folder for clone: "${folder}", it must not exist.`);
    }
  } else {
    const { projectPath } = await inquirer.prompt([
      questions.projectPath(join('content', project.data.name)),
    ]);
    folder = projectPath;
  }
  return {
    siteProject: { path: folder, slug: project.data.name },
    projectConfig,
  };
}

/**
 * Clone a project from curvenote.com to a given path
 *
 * Prompts for project link if no project link is given
 */
export async function clone(
  session: ISession,
  remote?: string,
  folder?: string,
  opts?: Pick<Options, 'yes'>,
) {
  let siteConfig: SiteConfig | undefined;
  try {
    siteConfig = loadSiteConfigOrThrow(session.store);
  } catch (error) {
    session.log.debug('Site config not found');
  }
  const { siteProject, projectConfig } = await interactiveCloneQuestions(session, {
    ...opts,
    remote,
    folder,
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
