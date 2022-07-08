import { v4 as uuid } from 'uuid';
import { getSession } from '../src/cli/services/utils';

import Bottleneck from 'bottleneck';
import { Block } from '../src/models';
import { BlockId } from '@curvenote/blocks';

const referenceBlockId = {
  project: 'yxMixqONzyNvXmmIAIsq',
  block: 'QabM62lNX1wh2uDOy3nY',
};

async function main() {
  const session = getSession();
  console.log('Got session', session.API_URL);

  const reference = await new Block(session, referenceBlockId).get();

  const { status, json } = await session.get(
    `/blocks/${referenceBlockId.project}?kind=Article,Notebook&limit=500`,
  );

  const limiter = new Bottleneck({ maxConcurrent: 25 });

  console.log(`Found ${json.items.length} blocks`);

  console.log(`Updating...`);
  await Promise.all(
    json.items.map(async ({ id }: { id: BlockId }) => {
      await limiter.schedule(() =>
        session.patch(`/blocks/${id.project}/${id.block}`, { authors: reference.data.authors }),
      );
    }),
  );

  console.log(`Done`);
}

main();
