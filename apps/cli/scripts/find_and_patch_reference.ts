import { getSession } from '../src/cli/services/utils';
import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { Version } from '../src';
import { Block, BlockChildDict, Blocks, ContentFormatTypes, KINDS } from '@curvenote/blocks';
import { nanoid } from 'nanoid';
import fetch from 'node-fetch';
import Bottleneck from 'bottleneck';

const PROJECT_ID = 'UQpQnbX8k8j6zcU3ZLtz';

async function main() {
  const session = getSession();
  console.log('Got session', session.API_URL);

  const { status, json } = await session.get(
    `/blocks/${PROJECT_ID}?kind=${KINDS.Reference}&limit=500`,
  );

  const limiter = new Bottleneck({ maxConcurrent: 25 });

  const versions: any[] = await Promise.all(
    json.items.map(async (item: Block) => {
      return await limiter.schedule(() =>
        new Version<Blocks.Reference>(session, { ...item.id, version: item.latest_version }).get(),
      );
    }),
  );

  console.log('Searching references');
  let found = 0;
  versions.map((v) => {
    const { content } = v.data;
    if (content.includes('10.22069/jwfst.2016.3190')) {
      console.log(v.id);
      console.log(content);
      found += 1;
    }
  });
  console.log(`Found ${found}`);
}

main();
