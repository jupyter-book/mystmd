import { ProjectId, Blocks } from '@curvenote/blocks';
import { Project } from '../../models';
import { Session } from '../../session';
import { exportFromProjectLink } from '../utils';
import { getLatestVersion } from '../../actions/getLatest';
import { writeTOC } from './toc';
import { exportAll } from './exportAll';
import { writeConfig } from './config';

type Options = {
  something?: string;
};

export async function projectToJupyterBook(session: Session, projectId: ProjectId, opts: Options) {
  const [project, { version: nav }] = await Promise.all([
    new Project(session, projectId).get(),
    getLatestVersion<Blocks.Navigation>(session, { project: projectId, block: 'nav' }),
  ]);
  writeConfig({
    title: project.data.title,
    author: project.data.team,
    url: `${session.SITE_URL}/@${project.data.team}/${project.data.name}`,
  });
  await writeTOC(session, nav);
  await exportAll(session, nav);
}

export const oxaLinkToJupyterBook = exportFromProjectLink(projectToJupyterBook);
