import { fileWarn, type GenericNode, type GenericParent } from 'myst-common';
import type { List, Text } from 'myst-spec';
import type { Link, ListItem } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

type ProjectPage = {
  title: string;
  level: number;
  slug?: string;
  enumerator?: string;
};

function listFromPages(pages: ProjectPage[], projectSlug?: string): List {
  if (pages.length === 0) return { type: 'list', children: [] };
  let ignore = false;
  const level = pages[0].level;
  const children = pages
    .map((page, index) => {
      if (ignore) return undefined;
      if (page.level < level) ignore = true;
      if (page.level !== level) return undefined;
      return listItemFromPages(pages.slice(index), projectSlug);
    })
    .filter((item): item is ListItem => !!item);
  return { type: 'list', children };
}

function listItemFromPages(pages: ProjectPage[], projectSlug?: string) {
  if (pages.length === 0) return;
  const { title, slug, enumerator, level } = pages[0];
  const text: Text = {
    type: 'text',
    value: `${enumerator ? `${enumerator} ` : ''}${title}`,
  };
  const child: Text | Link = slug
    ? ({
        type: 'link',
        url: `${projectSlug ? `/${projectSlug}` : ''}/${slug}`,
        internal: true,
        children: [text],
      } as Link)
    : text;
  const item: ListItem = {
    type: 'listItem',
    children: [child],
  };
  if (pages[1] && pages[1].level > level) {
    item.children.push(listFromPages(pages.slice(1), projectSlug));
  }
  return item;
}

export function buildTocTransform(
  mdast: GenericParent,
  vfile: VFile,
  pages: ProjectPage[],
  projectSlug?: string,
) {
  if (pages.length === 0) return;
  const tocs = selectAll('toc', mdast) as GenericNode[];
  if (!tocs.length) return;
  if (pages[0].level !== 1) {
    fileWarn(vfile, `First page of Table of Contents must be level 1`);
  }
  tocs.forEach((toc) => {
    toc.type = 'block';
    toc.data = { part: 'toc' };
    if (!toc.children) toc.children = [];
    toc.children.push(listFromPages(pages, projectSlug));
  });
}
