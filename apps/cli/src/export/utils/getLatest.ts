import { ALL_BLOCKS, BlockId, versionIdToString } from '@curvenote/blocks';
import { Block, Version, VersionQueryOpts } from '../../models';
import { ISession } from '../../session/types';

export async function getBlockAndLatestVersion<T extends ALL_BLOCKS>(
  session: ISession,
  blockId: BlockId,
  query?: VersionQueryOpts,
): Promise<{ block: Block; version?: Version<T> }> {
  session.log.debug(`getBlockAndLatestVersion(${JSON.stringify(blockId)})`);
  const block = await new Block(session, blockId).get();
  const { latest_version } = block.data;
  if (!latest_version) {
    const nameMessage = block.data.name ? `with name "${block.data.name}" ` : '';
    session.log.debug(`Block ${nameMessage}has no versions, do you need to save the draft?`);
    return { block };
  }
  session.log.debug(`Requesting latest version ${latest_version}`);
  const versionId = { ...block.id, version: latest_version };
  session.log.debug(`Fetching latest version of block: ${versionIdToString(versionId)}`);
  const version = await new Version<T>(session, versionId).get(query);
  return { block, version };
}
