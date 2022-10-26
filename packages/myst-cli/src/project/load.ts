import chalk from 'chalk';
import fs from 'fs';
import { join } from 'path';
import { loadConfigAndValidateOrThrow } from '../config';
import { loadFile, combineProjectCitationRenderers } from '../process';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { projects } from '../store/reducers';
import { getAllBibTexFilesOnPath, isDirectory, isUrl, validateTOC } from '../utils';
import { projectFromPath } from './fromPath';
import { projectFromToc } from './fromToc';
import { writeTocFromProject } from './toToc';
import type { LocalProject, LocalProjectPage } from './types';

/**
 * Load project structure from disk from
 *
 * @param session
 * @param path - root directory of project, relative to current directory
 * @param opts - `index`, including path relative to current directory; default is 'index.md'
 *     or 'readme.md' in 'path' directory
 *
 * If jupyterbook '_toc.yml' exists in path, project structure will be derived from that.
 * In this case, index will be ignored in favor of root from '_toc.yml'
 * If '_toc.yml' does not exist, project structure will be built from the local file/foler structure.
 */
export function loadProjectFromDisk(
  session: ISession,
  path: string,
  opts?: { index?: string; writeToc?: boolean },
): LocalProject {
  path = path || '.';
  const projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), path);
  let newProject: Omit<LocalProject, 'bibliography'> | undefined;
  let { index, writeToc } = opts || {};
  if (validateTOC(session, path)) {
    newProject = projectFromToc(session, path);
    writeToc = false;
  } else {
    const project = selectors.selectLocalProject(session.store.getState(), path);
    if (!index && project?.file) {
      index = project.file;
    }
    newProject = projectFromPath(session, path, index);
  }
  if (!newProject) {
    throw new Error(`Could not load project from ${path}`);
  }
  if (writeToc) {
    try {
      session.log.info(
        `📓 Writing '_toc.yml' file to ${path === '.' ? 'the current directory' : path}`,
      );
      writeTocFromProject(newProject, path);
      // Re-load from TOC just in case there are subtle differences with resulting project
      newProject = projectFromToc(session, path);
    } catch {
      session.log.error(`Error writing '_toc.yml' file to ${path}`);
    }
  }
  const allBibFiles = getAllBibTexFilesOnPath(session, path);
  let bibliography: string[];
  if (projectConfig?.bibliography) {
    const projectConfigFile = selectors.selectLocalConfigFile(session.store.getState(), path);
    const bibConfigPath = `${projectConfigFile}#bibliography`;
    bibliography = projectConfig.bibliography.filter((bib) => {
      if (allBibFiles.includes(bib)) return true;
      if (isUrl(bib)) return true;
      session.log.warn(`⚠️  ${bib} not found, loaded from ${bibConfigPath}`);
      return false;
    });
    allBibFiles.forEach((bib) => {
      if (bibliography.includes(bib)) return;
      session.log.info(
        chalk.dim(`🔍 ${bib} exists, but the file is not referenced in ${bibConfigPath}`),
      );
    });
  } else {
    bibliography = allBibFiles;
  }
  const project: LocalProject = { ...newProject, bibliography };
  session.store.dispatch(projects.actions.receive(project));
  return project;
}

export async function loadProjectAndBibliography(session: ISession, path: string) {
  const { bibliography } = loadProjectFromDisk(session, path);
  if (bibliography) {
    await Promise.all(bibliography.map((p: string) => loadFile(session, p, '.bib')));
    combineProjectCitationRenderers(session, path);
  }
}

export function findProjectsOnPath(session: ISession, path: string) {
  let projectPaths: string[] = [];
  const content = fs.readdirSync(path);
  if (session.configFiles.filter((file) => content.includes(file)).length) {
    loadConfigAndValidateOrThrow(session, path);
    if (selectors.selectLocalProjectConfig(session.store.getState(), path)) {
      projectPaths.push(path);
    }
  }
  content
    .map((dir) => join(path, dir))
    .filter((file) => isDirectory(file))
    .forEach((dir) => {
      projectPaths = projectPaths.concat(findProjectsOnPath(session, dir));
    });
  return projectPaths;
}

export function filterPages(project: LocalProject) {
  const pages: LocalProjectPage[] = [
    { file: project.file, slug: project.index, level: 1 },
    ...project.pages.filter((page): page is LocalProjectPage => 'file' in page),
  ];
  return pages;
}
