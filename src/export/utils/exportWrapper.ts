import { oxaLinkToId, VersionId } from '@curvenote/blocks';
import { getLatestVersion } from '../../actions/getLatest';
import { Block } from '../../models';
import { Session } from '../../session';

export const exportFromOxaLink =
  (exportArticle: (session: Session, id: VersionId, opts: { filename: string }) => Promise<void>) =>
  async (session: Session, link: string, filename: string, opts?: Record<string, string>) => {
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
