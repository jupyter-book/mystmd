import { ProjectId, Blocks } from '@curvenote/blocks';
import { Project } from '../../models';
import { ISession } from '../../session/types';
import { exportFromProjectLink } from '../utils/exportWrapper';
import { getBlockAndLatestVersion } from '../utils/getLatest';
import { exportAll, ExportAllOptions } from './exportAll';
import { writeConfig } from './jbConfig';
import { writeTOC } from './toc';

type Options = Omit<ExportAllOptions, 'bibtex'> & {
  writeConfig?: boolean;
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
      `Unable to load project "${project.data.name}" - do you need to save a draft?`,
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
  await writeTOC(session, nav, { path: opts.path });
  await exportAll(session, nav, { ...opts, bibtex: 'references.bib' });
}

export const oxaLinkToJupyterBook = exportFromProjectLink(projectToJupyterBook);
