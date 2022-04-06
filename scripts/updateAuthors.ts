import { v4 as uuid } from 'uuid';
import { getSession } from '../src/cli/services/utils';

import Bottleneck from 'bottleneck';
import { Block } from '../src/models';
import { BlockId } from '@curvenote/blocks';

const PROJECT_ID = 'ANIrcw5lvVZsEvuPctw5';

const newAuthorsInfo = [
  {
    id: uuid(),
    userId: null,
    name: 'Plain Author',
    orcid: null,
    corresponding: false,
    email: null,
    roles: [],
    affiliations: [],
  },
];

async function main() {
  const session = getSession();
  console.log('Got session', session.API_URL);

  const { status, json } = await session.get(
    `/blocks/${PROJECT_ID}?kind=Article,Notebook&limit=500`,
  );

  const limiter = new Bottleneck({ maxConcurrent: 25 });

  console.log(`Found ${json.items.length} blocks`);

  console.log(`Updating...`);
  await Promise.all(
    json.items.map(async ({ id }: { id: BlockId }) => {
      await limiter.schedule(() =>
        session.patch(`/blocks/${id.project}/${id.block}`, { authors: newAuthorsInfo }),
      );
    }),
  );

  console.log(`Done`);
}

main();
