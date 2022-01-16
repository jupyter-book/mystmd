import fs from 'fs';
import YAML from 'yaml';
import { Blocks } from '@curvenote/blocks';
import { Block, Version } from '../..';
import { ISession } from '../../session/types';

interface Options {
  filename: string;
}

export async function writeTOC(session: ISession, nav: Version<Blocks.Navigation>, opts?: Options) {
  const { filename = '_toc.yml' } = opts ?? {};
  const items = await Promise.all(
    nav.data.items.map(async (item) => {
      return {
        id: item.id,
        parent: item.parentId,
        block: await new Block(session, item.blockId).get(),
      };
    }),
  );

  const tocData = {
    format: 'jb-book',
    root: items[0].block.data.name,
    chapters: items.slice(1).map(({ block }) => ({ file: block.data.name })),
  };

  const toc = `# Table of contents\n# Learn more at https://jupyterbook.org/customize/toc.html\n\n${YAML.stringify(
    tocData,
  )}\n`;
  fs.writeFileSync(filename, toc);
}
