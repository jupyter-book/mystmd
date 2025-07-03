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

function makeList(children?: ListItem[]): List {
  return { type: 'list', children: !!children ? children : [] };
}

function makeListItem(child: Text | Link): ListItem {
  return { type: 'listItem', children: [child] };
}

function listFromPages(pages: ProjectPage[], projectSlug?: string): List {
  if (pages.length === 0) return makeList();
  let ignore = false;
  const level = pages[0].level;
  const children = pages
    .map((page, index) => {
      if (ignore) return undefined;
      if (page.level < level) ignore = true;
      if (page.level !== level) return undefined;
      return listItemFromPages(pages.slice(index), projectSlug);
    })
    // Remove any null items
    .filter((item): item is ListItem => !!item);
  return makeList(children);
}

function listItemFromPages(pages: ProjectPage[], projectSlug?: string): ListItem {
  if (pages.length === 0) return;
  const page = pages[0];
  const child = listItemChildFromPage(page, projectSlug);
  const item = makeListItem(child);
  if (pages[1] && pages[1].level > page.level) {
    item.children.push(listFromPages(pages.slice(1), projectSlug));
  }
  return item;
}

function listItemChildFromPage(page: ProjectPage, projectSlug?: string): Text | Link {
  const { title, slug, url, enumerator, level } = page;
  const text: Text = {
    type: 'text',
    value: `${enumerator ? `${enumerator} ` : ''}${title}`,
  };
  // Link to an external site if url is given
  if (!!url) {
    return {
      type: 'link',
      url: url,
      internal: false,
      children: [text],
    } as Link;
  // Link to an internal page if slug is given
  } else if (slug != null) {
    return {
      type: 'link',
      url: `${projectSlug ? `/${projectSlug}` : ''}/${slug}`,
      internal: true,
      children: [text],
    } as Link;
  // Otherwise plain text
  } else {
    return text;
  }
}

function listFromHeadings(headings: Heading[]): List {
  if (headings.length === 0) return makeList();
  let ignore = false;
  const depth = headings[0].depth;
  const children = headings
    .map((heading, index) => {
      if (ignore) return undefined;
      if (heading.depth < depth) ignore = true;
      if (heading.depth !== depth) return undefined;
      return listItemFromHeadings(headings.slice(index));
    })
    // Remove any null items
    .filter((item): item is ListItem => !!item);
  return makeList(children);
}

function listItemFromHeadings(headings: Heading[]) : ListItem {
  if (headings.length === 0) return;
  const heading = headings[0];
  const child = listItemChildFromHeading(heading);
  const item = makeListItem(child);
  if (headings[1] && headings[1].depth > heading.depth) {
    item.children.push(listFromHeadings(headings.slice(1)));
  }
  return item;
}

function listItemChildFromHeading(heading: Heading): Text | Link {
  const { children, enumerator, depth, identifier } = heading;
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
  return child;
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
