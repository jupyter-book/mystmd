import { validateTOC } from '../export/jupyter-book/toc';
import { join } from 'path';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { projects } from '../store/local';
import { projectFromPath } from './fromPath';
import { projectFromToc } from './fromToc';
import { writeTocFromProject } from './toToc';
import type { LocalProject } from './types';
import { getAllBibTexFilesOnPath } from './utils';
import { CURVENOTE_YML } from '../config/types';
import { isUrl } from '../utils';
import chalk from 'chalk';

/**
 * Load project structure from disk from
 *
 * @param session
 * @param path - root directory of project, relative to current directory; default is '.'
 * @param opts - `index`, including path relative to current directory; default is 'index.md'
 *     or 'readme.md' in 'path' directory
 *
 * If jupyterbook '_toc.yml' exists in path, project structure will be derived from that.
 * In this case, index will be ignored in favor of root from '_toc.yml'
 * If '_toc.yml' does not exist, project structure will be built from the local file/foler structure.
 */
export function loadProjectFromDisk(
  session: ISession,
  path?: string,
  opts?: { index?: string; writeToc?: boolean },
): LocalProject {
  path = path || '.';
  const projectConfig = selectors.selectProjectConfig(session.store.getState(), path);
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
    const bibConfigPath = `${join(path ?? '.', CURVENOTE_YML)}#bibliography`;
    bibliography = projectConfig.bibliography
      .map((bib) => {
        if (isUrl(bib)) return bib;
        return join(path ?? '.', bib);
      })
      .filter((bib) => {
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
