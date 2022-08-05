import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import { join } from 'path';
import { loadConfigOrThrow, writeConfigs } from '../config';
import type { ProjectConfig, SiteConfig, SiteProject } from '../config/types';
import { projectIdFromLink } from '../export';
import { LogLevel } from '../logging';
import type { Project } from '../models';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { pullProject } from './pull';
import questions from './questions';
import type { SyncCiHelperOptions } from './types';
import {
  getDefaultProjectConfig,
  getDefaultSiteConfigFromRemote,
  processOption,
  validateLinkIsAProject,
} from './utils';

type Options = {
  remote?: string;
  path?: string;
} & SyncCiHelperOptions;

export async function interactiveCloneQuestions(
  session: ISession,
  opts?: Options,
): Promise<{ siteProject: SiteProject; projectConfig: ProjectConfig }> {
  // This is an interactive clone
  let project: Project | undefined;
  if (opts?.remote) {
    project = await validateLinkIsAProject(session, opts.remote);
    if (!project) throw new Error(`Invalid remote address: "${opts.remote}"`);
  } else {
    while (!project) {
      const { projectLink } = await inquirer.prompt([questions.projectLink()]);
      project = await validateLinkIsAProject(session, projectLink);
    }
  }
  let path: string;
  const defaultPath = join('content', project.data.name);
  if (opts?.path || opts?.yes) {
    path = opts?.path ?? defaultPath;
    if (path !== '.' && fs.existsSync(path)) {
      throw new Error(`Invalid path for clone: "${path}", it must not exist.`);
    }
  } else {
    const { projectPath } = await inquirer.prompt([questions.projectPath(defaultPath)]);
    path = projectPath;
  }
  try {
    // Throw if project doesn't exist - that's what we want!
    loadConfigOrThrow(session, path);
    if (!selectors.selectLocalProjectConfig(session.store.getState(), path)) throw Error();
  } catch {
    // Project config does not exist; good!
    // TODO: Add all sorts of other stuff for the project data that we know!!
    const projectConfig = getDefaultProjectConfig(project.data.title);
    projectConfig.remote = project.data.id;
    projectConfig.description = project.data.description;
    return {
      siteProject: { path, slug: project.data.name },
      projectConfig,
    };
  }
  throw new Error(
    `Project already exists: "${path}" - did you mean to ${chalk.bold('curvenote pull')}`,
  );
}

/**
 * Interactively clone a project from curvenote.com to a given path
 *
 * If a site config is present, the project is also added to the site.
 */
export async function clone(session: ISession, remote?: string, path?: string, opts?: Options) {
  const processedOpts = processOption(opts);
  // Site config is loaded on session init
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (!siteConfig) {
    session.log.debug('Site config not found');
  }
  const { siteProject, projectConfig } = await interactiveCloneQuestions(session, {
    ...processedOpts,
    remote,
    path,
  });
  writeConfigs(session, siteProject.path, { projectConfig });
  if (!siteConfig && remote) {
    // If there is no site config, but a remote is provided, create a config
    const newSiteConfig = await getDefaultSiteConfigFromRemote(
      session,
      projectIdFromLink(session, remote),
      siteProject,
    );
    writeConfigs(session, '.', { siteConfig: newSiteConfig });
  } else if (siteConfig) {
    const newSiteConfig: SiteConfig = {
      ...siteConfig,
      nav: [...siteConfig.nav, { title: projectConfig.title || '', url: `/${siteProject.slug}` }],
      projects: [...siteConfig.projects, siteProject],
    };
    writeConfigs(session, '.', { siteConfig: newSiteConfig });
  }
  await pullProject(session, siteProject.path, { level: LogLevel.info, ci: opts?.ci });
}
