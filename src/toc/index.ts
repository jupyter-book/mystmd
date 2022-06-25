import { validateTOC } from '../export/jupyter-book/toc';
import { ISession } from '../session/types';
import { selectors } from '../store';
import { projects } from '../store/local';
import { projectFromPath } from './fromPath';
import { projectFromToc } from './fromToc';
import { writeTocFromProject } from './toToc';
import { LocalProject } from './types';

/**
 * Load project structure from disk from
 *
 * @param session
 * @param path - root directory of project, relative to current directory; default is '.'
 * @param index - index file, including path relative to current directory; default is 'index.md'
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
  let newProject;
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
      session.log.info(`📓 Writing '_toc.yml' file to ${path}`);
      writeTocFromProject(newProject, path);
      // Re-load from TOC just in case there are subtle differences with resulting project
      newProject = projectFromToc(session, path);
    } catch {
      session.log.error(`Error writing '_toc.yml' file to ${path}`);
    }
  }
  session.store.dispatch(projects.actions.receive(newProject));
  return newProject;
}
