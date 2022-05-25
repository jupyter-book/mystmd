import chalk from 'chalk';
import path from 'path';
import { docLinks } from '../docs';
import { projectIdFromLink } from '../export';
import { Project } from '../models';
import { ISession } from '../session/types';
import { ProjectConfig, SiteConfig } from '../types';

export function projectLogString(project: Project) {
  return `"${project.data.title}" (@${project.data.team}/${project.data.name})`;
}

export const INIT_LOGO_PATH = path.join('public', 'logo.svg');

export function getDefaultSiteConfig(title?: string): SiteConfig {
  return {
    title: title || 'My Curve Space',
    domains: [],
    logo: INIT_LOGO_PATH,
    logoText: title || 'My Curve Space',
    nav: [],
    actions: [{ title: 'Learn More', url: docLinks.curvespace }],
    projects: [],
  };
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
  session.log.info(chalk.green(`🚀 Found ${projectLogString(project)}`));
  return project;
}
