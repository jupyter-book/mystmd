import { VersionId } from '@curvenote/blocks';
import { Block, Version } from '../models';
import { ISession } from '../session/types';

export async function getChildren(session: ISession, versionId: VersionId) {
  const { status, json } = await session.get(
    `/blocks/${versionId.project}/${versionId.block}/versions/${versionId.version}/children`,
  );
  if (status !== 200) throw new Error('Could not get children');
  const blocks = json.blocks.items.map((item: any) => {
    const block = new Block(session, item.id);
    block.data = item;
    return block;
  });
  const versions = json.versions.items.map((item: any) => {
    const version = new Version(session, item.id);
    version.data = item;
    return version;
  });
  return { blocks, versions };
}
