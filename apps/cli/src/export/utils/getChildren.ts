import type { VersionId } from '@curvenote/blocks';
import { Block, Version } from '../../models';
import type { ISession } from '../../session/types';
import { versionIdToURL } from '../../utils';

export async function getChildren(session: ISession, versionId: VersionId) {
  const url = `${versionIdToURL(versionId)}/children`;
  session.log.debug(`Fetching version children: ${url}`);
  const { ok, json } = await session.get(url);
  if (!ok) throw new Error('Could not get children');
  session.log.debug(
    `Version children include ${json.blocks.items.length} block(s) and ${json.versions.items.length} version(s)`,
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
