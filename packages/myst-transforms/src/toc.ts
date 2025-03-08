import { fileError, fileWarn, toText, type GenericNode, type GenericParent } from 'myst-common';
import type { List, Text } from 'myst-spec';
import type { Heading, Link, ListItem } from 'myst-spec-ext';
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
  const child: Text | Link =
    slug != null
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

function listFromHeadings(headings: Heading[]): List {
  if (headings.length === 0) return { type: 'list', children: [] };
  let ignore = false;
  const depth = headings[0].depth;
  const children = headings
    .map((heading, index) => {
      if (ignore) return undefined;
      if (heading.depth < depth) ignore = true;
      if (heading.depth !== depth) return undefined;
      return listItemFromHeadings(headings.slice(index));
    })
    .filter((item): item is ListItem => !!item);
  return { type: 'list', children };
}

function listItemFromHeadings(headings: Heading[]) {
  if (headings.length === 0) return;
  const { children, enumerator, depth, identifier } = headings[0];
  const text: Text = {
    type: 'text',
    value: `${enumerator ? `${enumerator} ` : ''}${toText(children)}`,
  };
  const child: Text | Link = identifier
    ? ({
        type: 'link',
        url: `#${identifier}`,
        internal: true,
        children: [text],
        suppressImplicitWarning: true,
      } as Link)
    : text;
  const item: ListItem = {
    type: 'listItem',
    children: [child],
  };
  if (headings[1] && headings[1].depth > depth) {
    item.children.push(listFromHeadings(headings.slice(1)));
  }
  return item;
}

export function buildTocTransform(
  mdast: GenericParent,
  vfile: VFile,
  pages?: ProjectPage[],
  projectSlug?: string,
) {
  const tocHeadings = selectAll('toc > heading', mdast);
  const tocsAndHeadings = selectAll('toc,heading', mdast).filter((item) => {
    // Do not include toc headings anywhere in this transform
    return !tocHeadings.includes(item);
  }) as GenericNode[];
  if (!tocsAndHeadings.find((node) => node.type === 'toc')) return;
  const projectTocs = tocsAndHeadings.filter(
    (node) => node.type === 'toc' && node.kind === 'project',
  );
  const pageTocs = tocsAndHeadings.filter((node) => node.type === 'toc' && node.kind === 'page');
  const sectionTocs = tocsAndHeadings.filter(
    (node) => node.type === 'toc' && node.kind === 'section',
  );
  if (projectTocs.length) {
    if (!pages) {
      fileError(vfile, `Pages not available to build Table of Contents`);
    } else {
      if (pages[0].level !== 1) {
        fileWarn(vfile, `First page of Table of Contents must be level 1`);
      }
      projectTocs.forEach((toc) => {
        const filteredPages = toc.depth ? pages.filter((page) => page.level <= toc.depth) : pages;
        toc.type = 'block';
        delete toc.kind;
        toc.data = { part: 'toc:project' };
        if (!toc.children) toc.children = [];
        toc.children.push(listFromPages(filteredPages, projectSlug));
      });
    }
  }
  if (pageTocs.length) {
    const headings = tocsAndHeadings.filter((node) => node.type === 'heading') as Heading[];
    if (headings.length === 0) {
      fileWarn(vfile, `No page headings found for Table of Contents`);
    } else {
      if (Math.min(...headings.map((h) => h.depth)) !== headings[0].depth) {
        fileWarn(vfile, 'Page heading levels do not start with highest level');
      }
      pageTocs.forEach((toc) => {
        const filteredHeadings = toc.depth
          ? headings.filter((heading) => heading.depth - headings[0].depth < toc.depth)
          : headings;
        toc.type = 'block';
        delete toc.kind;
        toc.data = { part: 'toc:page' };
        if (!toc.children) toc.children = [];
        toc.children.push(listFromHeadings(filteredHeadings));
      });
    }
  }
  if (sectionTocs.length) {
    tocsAndHeadings.forEach((toc, index) => {
      if (toc.type !== 'toc' || toc.kind !== 'section') return;
      const headings = tocsAndHeadings
        .slice(index + 1)
        .filter((h) => h.type === 'heading') as Heading[];
      if (headings.length === 0) {
        fileWarn(vfile, `No section headings found for Table of Contents`);
      } else {
        const filteredHeadings = toc.depth
          ? headings.filter((heading) => heading.depth - headings[0].depth < toc.depth)
          : headings;
        toc.type = 'block';
        delete toc.kind;
        toc.data = { part: 'toc:section' };
        if (!toc.children) toc.children = [];
        const nextSection = filteredHeadings.findIndex((h) => h.depth < filteredHeadings[0].depth);
        toc.children.push(
          listFromHeadings(
            nextSection === -1 ? filteredHeadings : filteredHeadings.slice(0, nextSection),
          ),
        );
      }
    });
  }
}
