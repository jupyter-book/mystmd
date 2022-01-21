import fs from 'fs';
import YAML from 'yaml';
import { Blocks } from '@curvenote/blocks';
import { Block, Version } from '../..';
import { ISession } from '../../session/types';

interface Options {
  filename: string;
}

type FolderItem = {
  id: string;
  block: Block;
  children: FolderItem[];
};

type JupyterBookChapter = {
  file: string;
  sections?: JupyterBookChapter[];
};

function recurseToc(item: FolderItem): JupyterBookChapter {
  const chapter: JupyterBookChapter = { file: item.block.data.name as string };
  if (item.children && item.children.length > 0) {
    chapter.sections = item.children.map(recurseToc);
  }
  return chapter;
}

export async function writeTOC(session: ISession, nav: Version<Blocks.Navigation>, opts?: Options) {
  const { filename = '_toc.yml' } = opts ?? {};

  const loadedBlocks = await Promise.all(
    nav.data.items.map(async (item) => {
      const { parentId, id } = item;
      const block = await new Block(session, item.blockId).get();
      return { id, parentId, block };
    }),
  );

  const nest: Record<string, FolderItem[]> = {};

  const items: FolderItem[] = [];

  loadedBlocks.forEach(({ id, parentId, block }) => {
    const children: FolderItem[] = [];
    nest[id] = children;
    if (parentId) {
      const folder = nest[parentId];
      folder.push({ id, block, children });
      return;
    }
    items.push({ id, block, children });
  });

  const tocData = {
    format: 'jb-book',
    root: items[0].block.data.name,
    chapters: items.slice(1).map(recurseToc),
  };

  const toc = `# Table of contents\n# Learn more at https://jupyterbook.org/customize/toc.html\n\n${YAML.stringify(
    tocData,
  )}\n`;
  fs.writeFileSync(filename, toc);
}
