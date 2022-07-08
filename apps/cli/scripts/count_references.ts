import { getSession } from '../src/cli/services/utils';
import { KINDS } from '@curvenote/blocks';

const PROJECT_ID = 'UQpQnbX8k8j6zcU3ZLtz';

async function main() {
  const session = getSession();
  console.log('Got session', session.API_URL);

  const resp = await session.get(`/blocks/${PROJECT_ID}?kind=${KINDS.Reference}&limit=1000`);
  console.log('# References', resp.json.items.length);

  const resp2 = await session.get(`/blocks/${PROJECT_ID}?limit=1000`);
  let next = resp2.json.links.next;
  let blockCount = resp2.json.items.length;
  while (next) {
    console.log(next);
    const respNext = await session.get(next);
    blockCount += respNext.json.items.length;
    next = respNext.json.links.next;
  }
  console.log('# Blocks', blockCount);
}

main();
