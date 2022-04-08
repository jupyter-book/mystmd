import fs from 'fs';
import YAML from 'yaml';
import { Blocks, NavListItemKindEnum } from '@curvenote/blocks';
import { Block, Version } from '../../models';
import { ISession } from '../../session/types';

const TOC_FORMAT = 'jb-book';

interface Options {
  filename: string;
}

type FolderItem = {
  id: string;
  kind: NavListItemKindEnum;
  title?: string;
  block?: Block;
  children: FolderItem[];
};

type LoadedBlocks =
  | {
      id: string;
      kind: NavListItemKindEnum.Group;
      title: string;
    }
  | {
      id: string;
      parentId: string | null;
      kind: NavListItemKindEnum.Item;
      block: Block | null;
    };

export type JupyterBookPart = {
  caption?: string;
  chapters?: JupyterBookChapter[];
};

export type JupyterBookChapter = {
  file: string;
  sections?: JupyterBookChapter[];
};

export type TOC = {
  format: string;
  root: string;
  chapters?: JupyterBookChapter[];
  parts?: JupyterBookPart[];
};

function getName(block: Block): string {
  return block.data.name || block.id.block;
}

function recurseTocChapters(item: FolderItem): JupyterBookChapter | null {
  if (!item.block) return null;
  const chapter: JupyterBookChapter = { file: getName(item.block) };
  if (item.children && item.children.length > 0) {
    chapter.sections = item.children
      .map(recurseTocChapters)
      .filter((c) => c) as JupyterBookChapter[];
  }
  return chapter;
}

function itemsToChapters(items: FolderItem[]): JupyterBookChapter[] {
  const chapters = items.map(recurseTocChapters).filter((c) => c) as JupyterBookChapter[];
  return chapters;
}

/**
 * This brings the first `item` in the tree to be used as the root.
 */
function spliceRootFromNav(items: FolderItem[]): null | [FolderItem, FolderItem[]] {
  const next = [...items];
  for (let i = 0; i < next.length; i += 1) {
    const item = next[i];
    if (item.kind === NavListItemKindEnum.Item) {
      next.splice(i, 1);
      return [item, next];
    }
    const recurse = spliceRootFromNav(item.children);
    if (recurse) return recurse;
  }
  return null;
}

export async function writeTOC(session: ISession, nav: Version<Blocks.Navigation>, opts?: Options) {
  const { filename = '_toc.yml' } = opts ?? {};

  const loadedBlocks: LoadedBlocks[] = await Promise.all(
    nav.data.items.map(async (item) => {
      const { id, kind } = item;
      if (kind === NavListItemKindEnum.Group) {
        const { title } = item;
        return { id, kind, title };
      }
      const { parentId } = item;
      const block = await new Block(session, item.blockId).get().catch(() => null);
      return { id, kind, parentId, block };
    }),
  );

  const nest: Record<string, FolderItem[]> = {};

  const items: FolderItem[] = [];

  const hasParts = loadedBlocks.filter(({ kind }) => kind === NavListItemKindEnum.Group).length > 0;

  loadedBlocks.forEach((data) => {
    const children: FolderItem[] = [];
    const { id, kind } = data;
    nest[id] = children;
    if (kind === NavListItemKindEnum.Group) {
      const { title } = data;
      items.push({ id, kind, title, children });
      return;
    }
    const { parentId, block } = data;
    if (!block) return;
    if (parentId) {
      const folder = nest[parentId];
      folder.push({ id, kind, block, children });
      return;
    }
    items.push({ id, kind, block, children });
  });

  const header = '# Table of contents\n# Learn more at https://jupyterbook.org/customize/toc.html';
  if (!hasParts) {
    // There are no parts, just chapters
    const tocData: TOC = {
      format: TOC_FORMAT,
      root: getName(items[0].block as Block),
      chapters: itemsToChapters(items.slice(1)),
    };
    const toc = `${header}\n\n${YAML.stringify(tocData)}\n`;
    fs.writeFileSync(filename, toc);
    return;
  }
  // Deal with the parts
  const maybeSplit = spliceRootFromNav(items);
  if (!maybeSplit) throw new Error('Must have at least one content page.');
  const [root, rest] = maybeSplit;
  let index = 0;
  const parts = rest.map((item): JupyterBookPart => {
    if (item.kind === NavListItemKindEnum.Group) {
      return { caption: item.title as string, chapters: itemsToChapters(item.children) };
    }
    index += 1;
    return { caption: `Part ${index}`, chapters: itemsToChapters([item]) };
  });
  const tocData: TOC = {
    format: TOC_FORMAT,
    root: getName(root.block as Block),
    parts,
  };
  const toc = `${header}\n\n${YAML.stringify(tocData)}\n`;
  fs.writeFileSync(filename, toc);
}

export function readTOC(session: ISession, opts?: Options): TOC {
  const { filename = '_toc.yml' } = opts ?? {};
  const toc = YAML.parse(fs.readFileSync(filename).toString());
  const { format, root, chapters, parts } = toc;
  if (format !== TOC_FORMAT) throw new Error(`The toc.format must be ${TOC_FORMAT}.`);
  if (!root) throw new Error(`The toc.root must exist.`);
  if (!chapters && !parts) throw new Error(`The toc must have either chapters or parts.`);
  session.log.debug('Basic validation of TOC passed.');
  return toc;
}
