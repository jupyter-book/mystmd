import fs from 'fs';
import { join } from 'path';
import YAML from 'js-yaml';
import type { Blocks } from '@curvenote/blocks';
import { NavListItemKindEnum } from '@curvenote/blocks';
import type { Version } from '../../models';
import { Block } from '../../models';
import type { ISession } from '../../session/types';
import { writeFileToFolder } from '../../utils';
import type { Logger } from '../../logging';
import { silentLogger } from '../../logging';

export const tocFile = (filename: string): string => join(filename, '_toc.yml');

const TOC_FORMAT = 'jb-book';

interface Options {
  path?: string;
  filename?: string;
  ci?: boolean;
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
  file?: string;
  url?: string;
  title?: string;
  glob?: string;
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

function handleErrorMessage(session: ISession, shouldThrow: boolean, msg: string) {
  if (shouldThrow) {
    throw new Error(msg);
  }
  session.log.error(msg);
}

export function unflattenNavBlocks(loadedBlocks: LoadedBlocks[]) {
  const nest: Record<string, FolderItem[]> = {};
  const items: FolderItem[] = [];

  const groupNavItems = loadedBlocks.filter(({ kind }) => kind === NavListItemKindEnum.Group);
  const hasParts = groupNavItems.length > 0;
  const totalDocuments = loadedBlocks.length - groupNavItems.length;

  let skipCounter = 0;

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
    if (!block || block.data.hidden) {
      skipCounter++;
      return;
    }
    if (parentId && nest[parentId]) {
      const folder = nest[parentId];
      folder.push({ id, kind, block, children });
      return;
    }
    items.push({ id, kind, block, children });
  });
  return { items, hasParts, skipCounter, totalDocuments };
}

export async function writeTOC(session: ISession, nav: Version<Blocks.Navigation>, opts?: Options) {
  const filename = join(opts?.path || '.', opts?.filename || '_toc.yml');

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

  const { items, hasParts, skipCounter, totalDocuments } = unflattenNavBlocks(loadedBlocks);

  if (totalDocuments === 0) {
    handleErrorMessage(session, opts?.ci ?? false, 'The table of contents has no documents.');
    return;
  }

  const header = '# Table of contents\n# Learn more at https://jupyterbook.org/customize/toc.html';

  if (skipCounter === totalDocuments) {
    handleErrorMessage(
      session,
      opts?.ci ?? false,
      'All documents in the table of contents are hidden.',
    );
    return;
  }
  if (!hasParts) {
    // There are no parts, just chapters
    const tocData: TOC = {
      format: TOC_FORMAT,
      root: getName(items[0].block as Block),
      chapters: itemsToChapters([...items[0].children, ...items.slice(1)]),
    };
    const toc = `${header}\n\n${YAML.dump(tocData)}\n`;
    writeFileToFolder(filename, toc);
    return;
  }
  // Deal with the parts
  const maybeSplit = spliceRootFromNav(items);
  if (!maybeSplit) throw new Error('Must have at least one content page.');
  const [root, rest] = maybeSplit;
  let index = 0;
  const contents = [...root.children, ...rest];
  const parts = contents.map((item): JupyterBookPart => {
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
  const toc = `${header}\n\n${YAML.dump(tocData)}\n`;
  writeFileToFolder(filename, toc);
}

// See https://executablebooks.org/en/latest/updates/2021-06-18-update-toc.html
function upgradeOldJupyterBookToc(oldToc: any[]) {
  // TODO: numbering is ignored
  const [root, ...parts] = oldToc;
  const toc: TOC = {
    root: root.file,
    format: TOC_FORMAT,
    parts: parts.map(({ part, chapters }) => ({
      caption: part,
      chapters,
    })),
  };
  return toc;
}

export function readTOC(log: Logger, opts?: Options): TOC {
  const filename = join(opts?.path || '.', opts?.filename || '_toc.yml');
  const toc = YAML.load(fs.readFileSync(filename).toString()) as any;
  if (Array.isArray(toc)) {
    try {
      const old = upgradeOldJupyterBookToc(toc);
      log.warn(
        `${filename} is out of date: see https://executablebooks.org/en/latest/updates/2021-06-18-update-toc.html`,
      );
      return old;
    } catch (error) {
      throw new Error(
        `Could not upgrade toc, please see: https://executablebooks.org/en/latest/updates/2021-06-18-update-toc.html`,
      );
    }
  }
  const { format, root, chapters, parts } = toc;
  if (format !== TOC_FORMAT) throw new Error(`The toc.format must be ${TOC_FORMAT}`);
  if (!root) throw new Error(`The toc.root must exist`);
  if (!chapters && !parts) throw new Error(`The toc must have either chapters or parts`);
  log.debug('Basic validation of TOC passed');
  return toc;
}

export function validateTOC(session: ISession, path: string): boolean {
  const filename = tocFile(path);
  if (!fs.existsSync(filename)) return false;
  try {
    readTOC(silentLogger(), { filename });
    return true;
  } catch (error) {
    const { message } = error as unknown as Error;
    session.log.error(
      `The Table of Contents (ToC) file "${filename}" did not pass validation:\n - ${message}\n - An implicit ToC will be used instead\n`,
    );
    return false;
  }
}
