import { oxaLinkToId, ProjectId, VersionId } from '@curvenote/blocks';
import { getLatestVersion } from '../../actions/getLatest';
import { Block } from '../../models';
import { ISession } from '../../session/types';
import { ArticleState } from './walkArticle';

export const exportFromOxaLink =
  (
    exportArticle: (
      session: ISession,
      id: VersionId,
      opts: { filename: string },
    ) => Promise<ArticleState | void>,
  ) =>
  async (session: ISession, link: string, filename: string, opts?: Record<string, string>) => {
    const id = oxaLinkToId(link);
    if (!id) throw new Error('The article ID provided could not be parsed.');
    if ('version' in id.block) {
      // Ensure that we actually get a correct ID, and then use the version supplied
      const block = await new Block(session, id.block).get();
      await exportArticle(
        session,
        { ...block.id, version: id.block.version },
        { filename, ...opts },
      );
    } else {
      // Here we will load up the latest version
      const { version } = await getLatestVersion(session, id.block);
      await exportArticle(session, version.id, { filename, ...opts });
    }
  };

const knownServices = new Set(['blocks', 'drafts', 'projects']);

export const exportFromProjectLink =
  (
    exportProject: (
      session: ISession,
      id: ProjectId,
      opts: Record<string, string>,
    ) => Promise<void>,
  ) =>
  async (session: ISession, link: string, opts: Record<string, string>) => {
    let projectId: string | null = null;
    const id = oxaLinkToId(link);
    if (id) {
      projectId = id.block.project;
    } else if (link.startsWith(session.API_URL)) {
      const [service, project] = link.split('/').slice(3); // https://api.curvenote.com/{service}/{maybeProjectId}
      if (!knownServices.has(service)) throw new Error('Unknown API URL for project.');
      projectId = project;
    } else if (link.startsWith(session.SITE_URL)) {
      const [team, project] = link.split('/').slice(-2);
      projectId = `${team}:${project}`;
    } else {
      projectId = link;
    }
    if (!projectId) throw new Error('The project ID provided could not be parsed.');
    await exportProject(session, projectId, opts);
  };
