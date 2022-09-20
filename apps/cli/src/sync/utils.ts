import chalk from 'chalk';
import path from 'path';
import type { SiteConfig, SiteProject } from '@curvenote/blocks';
import type { ProjectConfig } from '../config/types';
import { docLinks } from '../docs';
import { projectIdFromLink } from '../export';
import { Project, RemoteSiteConfig } from '../models';
import type { ISession } from '../session/types';
import type { SyncCiHelperOptions } from './types';

export function projectLogString(project: Project) {
  return `"${project.data.title}" (@${project.data.team}/${project.data.name})`;
}

export const INIT_LOGO_PATH = path.join('public', 'logo.svg');

export function getDefaultSiteConfig(title?: string): SiteConfig {
  return {
    title: title || 'My Curve Space',
    domains: [],
    logo: INIT_LOGO_PATH,
    logo_text: title || 'My Curve Space',
    nav: [],
    actions: [{ title: 'Learn More', url: docLinks.web }],
    projects: [],
  };
}

export async function getDefaultSiteConfigFromRemote(
  session: ISession,
  projectId: string,
  siteProject: SiteProject,
): Promise<SiteConfig> {
  const project = await new Project(session, projectId).get();
  const remoteSiteConfig = await new RemoteSiteConfig(session, project.id).get();
  const siteConfig = getDefaultSiteConfig();
  siteConfig.title = project.data.title;
  siteConfig.logo_text = project.data.title;
  if (remoteSiteConfig.data.domains) siteConfig.domains = remoteSiteConfig.data.domains;
  // Add an entry to the nav if it doesn't exist (i.e. empty list is fine)
  if (!remoteSiteConfig.data.nav) {
    siteConfig.nav = [{ title: project.data.title || '', url: `/${siteProject.slug}` }];
  }
  siteConfig.projects = [...(siteConfig.projects || []), siteProject];
  return siteConfig;
}

export function getDefaultProjectConfig(title?: string): ProjectConfig {
  return {
    title: title || 'my-project',
  };
}

export async function validateLinkIsAProject(
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
  session.log.info(chalk.green(`🔍 Found ${projectLogString(project)}`));
  return project;
}

export function processOption(opts: SyncCiHelperOptions | undefined) {
  if (!opts) return undefined;
  return {
    ...opts,
    yes: opts.ci || opts.yes,
  };
}
