import { ProjectId, Blocks } from '@curvenote/blocks';
import { Project } from '../../models';
import { exportFromProjectLink } from '../utils';
import { getLatestVersion } from '../../actions/getLatest';
import { writeTOC } from './toc';
import { exportAll } from './exportAll';
import { writeConfig } from './jbConfig';
import { ISession } from '../../session/types';

type Options = {
  path?: string;
  writeConfig?: boolean;
  images?: string;
  bibtex?: string;
  createFrontmatter?: boolean;
};

export async function projectToJupyterBook(session: ISession, projectId: ProjectId, opts: Options) {
  const [project, { version: nav }] = await Promise.all([
    new Project(session, projectId).get(),
    getLatestVersion<Blocks.Navigation>(session, { project: projectId, block: 'nav' }),
  ]);
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
