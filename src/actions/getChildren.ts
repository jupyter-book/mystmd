import { VersionId } from '@curvenote/blocks';
import { Block, Version } from '../models';
import { ISession } from '../session/types';

export async function getChildren(session: ISession, versionId: VersionId) {
  const url = `/blocks/${versionId.project}/${versionId.block}/versions/${versionId.version}/children`;
  session.log.debug(`Fetching version children: ${url}`);
  const { status, json } = await session.get(url);
  if (status !== 200) throw new Error('Could not get children');
  session.log.debug(
    `Version children include ${json.blocks.items.length} block(s) and ${json.versions.items} version(s)`,
  );
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
