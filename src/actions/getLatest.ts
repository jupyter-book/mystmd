import { BlockId } from '@curvenote/blocks';
import { Block, Version } from '../models';
import { Session } from '../session';

export async function getLatestBlock(session: Session, blockId: BlockId) {
  const block = await new Block(session, blockId).get();
  const { latest_version } = block.data;
  if (!latest_version) throw new Error('Block has no versions');
  const version = await new Version(session, { ...block.id, version: latest_version }).get();
  return { block, version };
}
