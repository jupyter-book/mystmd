import type { ProjectId, Blocks } from '@curvenote/blocks';
import { Project } from '../../models';
import type { ISession } from '../../session/types';
import { exportFromProjectLink } from '../utils/exportWrapper';
import { getBlockAndLatestVersion } from '../utils/getLatest';
import type { ExportAllOptions } from './exportAll';
import { exportAll } from './exportAll';
import { writeConfig } from './jbConfig';
import { writeTOC } from './toc';

type Options = Omit<ExportAllOptions, 'bibtex'> & {
  writeConfig?: boolean;
  ci?: boolean;
};

/**
 * Write jupyterbook from project
 *
 * Logs an error if no version of the nav is saved.
 */
export async function projectToJupyterBook(session: ISession, projectId: ProjectId, opts: Options) {
  const [project, { version: nav }] = await Promise.all([
    new Project(session, projectId).get(),
    getBlockAndLatestVersion<Blocks.Navigation>(session, { project: projectId, block: 'nav' }),
  ]);
  if (!nav) {
    session.log.error(
      `Unable to load project navigation "${project.data.name}" - please save any article in your project?`,
    );
    return;
  }
  if (opts.writeConfig ?? true) {
    writeConfig(session, {
      path: opts.path,
      title: project.data.title,
      author: project.data.team,
      url: `${session.SITE_URL}/@${project.data.team}/${project.data.name}`,
    });
  }
  await writeTOC(session, nav, { path: opts.path, ci: opts.ci });
  await exportAll(session, nav, { ...opts, bibtex: 'references.bib' });
}

export const oxaLinkToJupyterBook = exportFromProjectLink(projectToJupyterBook);
