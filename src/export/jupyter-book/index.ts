import { ProjectId, Blocks } from '@curvenote/blocks';
import { Project } from '../../models';
import { exportFromProjectLink } from '../utils';
import { getLatestVersion } from '../../actions/getLatest';
import { writeTOC } from './toc';
import { exportAll } from './exportAll';
import { writeConfig } from './jbConfig';
import { ISession } from '../../session/types';

type Options = {
  images?: string;
  bibtex?: string;
};

export async function projectToJupyterBook(session: ISession, projectId: ProjectId, opts: Options) {
  const [project, { version: nav }] = await Promise.all([
    new Project(session, projectId).get(),
    getLatestVersion<Blocks.Navigation>(session, { project: projectId, block: 'nav' }),
  ]);
  writeConfig(session, {
    title: project.data.title,
    author: project.data.team,
    url: `${session.SITE_URL}/@${project.data.team}/${project.data.name}`,
  });
  await writeTOC(session, nav);
  await exportAll(session, nav, { ...opts, images: '_static', bibtex: 'references.bib' });
}

export const oxaLinkToJupyterBook = exportFromProjectLink(projectToJupyterBook);
