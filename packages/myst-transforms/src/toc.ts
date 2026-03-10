import {
  fileError,
  fileWarn,
  slugToUrl,
  toText,
  type GenericNode,
  type GenericParent,
} from 'myst-common';
import type { List, Text } from 'myst-spec';
import type { Heading, Link, ListItem } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

type ProjectPage = {
  title: string;
  level: number;
  slug?: string;
  url?: string;
  enumerator?: string;
};

function makeList(children?: ListItem[]): List {
  return { type: 'list', children: children != null ? children : [] };
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
    // Remove any undefined items.
    .filter((item): item is ListItem => item !== undefined);
  return makeList(children);
}

function listItemFromPages(pages: ProjectPage[], projectSlug?: string): ListItem {
  // pages will never be an empty array.
  const page = pages[0];
  const child = transformPage(page, projectSlug);
  const item = makeListItem(child);
  const nextPage = pages[1];

  // If there is a next page and it is the root of a subtree, recurse into it
  // and add the resultant List to this item's children.
  if (nextPage && nextPage.level > page.level) {
    item.children.push(listFromPages(pages.slice(1), projectSlug));
  }
  return item;
}

/**
 * transformPage captures the base case of the mutual recursion
 * implemented by the pair of functions listFromPages/listItemFromPages
 */
function transformPage(page: ProjectPage, projectSlug?: string): Text | Link {
  const { title, slug, url, enumerator, level } = page;
  const text: Text = {
    type: 'text',
    value: `${enumerator ? `${enumerator} ` : ''}${title}`,
  };
  // Link to an external site if url is given
  if (url !== undefined) {
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
      url: `${projectSlug ? `/${projectSlug}` : ''}/${slugToUrl(slug)}`,
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
    // Remove any undefined items.
    .filter((item): item is ListItem => item !== undefined);
  return makeList(children);
}

function listItemFromHeadings(headings: Heading[]): ListItem {
  // headings will never be an empty array.
  const heading = headings[0];
  const child = transformHeading(heading);
  const item = makeListItem(child);

  // If there is a next heading and it is the root of a subtree, recurse into it
  // and add the resultant List to this item's children.
  const nextHeading = headings[1];
  if (nextHeading && nextHeading.depth > heading.depth) {
    item.children.push(listFromHeadings(headings.slice(1)));
  }
  return item;
}

/**
 * transformHeading captures the base case of the mutual recursion
 * implemented by the pair of functions listFromHeadings/listItemFromHeadings
 */
function transformHeading(heading: Heading): Text | Link {
  const { children, enumerator, depth, identifier } = heading;
  const text: Text = {
    type: 'text',
    value: `${enumerator ? `${enumerator} ` : ''}${toText(children)}`,
  };
  return identifier
    ? ({
        type: 'link',
        url: `#${identifier}`,
        internal: true,
        children: [text],
        suppressImplicitWarning: true,
      } as Link)
    : text;
}

/** List every page in the project, mirroring the project's table of contents. */
function transformProjectTocs(
  vfile: VFile,
  tocsAndHeadings: GenericNode[],
  pages?: ProjectPage[],
  projectSlug?: string,
) {
  // Select 'project' type TOC nodes.
  const projectTocs = tocsAndHeadings.filter(
    (node) => node.type === 'toc' && node.kind === 'project',
  );
  // No project TOCs found, nothing to do.
  if (projectTocs.length === 0) return;

  if (!pages) {
    fileError(vfile, `Pages not available to build Table of Contents`);
    return;
  }

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

/** List only the child pages nested under the current page in the project TOC. */
function transformChildrenTocs(
  vfile: VFile,
  tocsAndHeadings: GenericNode[],
  pages?: ProjectPage[],
  projectSlug?: string,
  currentSlug?: string,
) {
  const childrenTocs = tocsAndHeadings.filter(
    (node) => node.type === 'toc' && node.kind === 'children',
  );
  if (childrenTocs.length === 0) return;

  if (!pages || currentSlug === undefined) {
    fileError(vfile, `Pages not available to build children Table of Contents`);
    return;
  }

  // Find the current page index
  const currentIndex = pages.findIndex((page) => page.slug === currentSlug);
  if (currentIndex === -1) {
    fileWarn(vfile, `Current page not found in project pages for children Table of Contents`);
    return;
  }

  const currentLevel = pages[currentIndex].level;
  // Extract child pages: pages after the current one with deeper level, stopping at equal/shallower
  const childPages: ProjectPage[] = [];
  for (let i = currentIndex + 1; i < pages.length; i++) {
    if (pages[i].level <= currentLevel) break;
    childPages.push(pages[i]);
  }

  childrenTocs.forEach((toc) => {
    // Filter out pages based on `depth` kwarg
    const filteredPages = toc.depth
      ? childPages.filter((page) => page.level - currentLevel <= toc.depth)
      : childPages;
    toc.type = 'block';
    delete toc.kind;
    toc.data = { part: 'toc:children' };
    if (!toc.children) toc.children = [];
    toc.children.push(listFromPages(filteredPages, projectSlug));
  });
}

/** List all headings on the current page. */
function transformPageTocs(vfile: VFile, tocsAndHeadings: GenericNode[]) {
  const pageTocs = tocsAndHeadings.filter((node) => node.type === 'toc' && node.kind === 'page');
  // No page TOCs found, nothing to do.
  if (pageTocs.length === 0) return;

  const headings = tocsAndHeadings.filter((node) => node.type === 'heading') as Heading[];
  if (headings.length === 0) {
    fileWarn(vfile, `No page headings found for Table of Contents`);
    return;
  }

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

/** List headings that follow the toc node in the current section. */
function transformSectionTocs(vfile: VFile, tocsAndHeadings: GenericNode[]) {
  const isSectionToc = (node: GenericNode) => node.type === 'toc' && node.kind === 'section';

  tocsAndHeadings.forEach((toc, index) => {
    if (!isSectionToc(toc)) return;

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

/**
 * Replace `{toc}` directive nodes with rendered lists.
 *
 * A page may contain multiple `{toc}` directives, each with a different
 * `:context:` value (project, children, page, section). This runs a transform
 * function for each context, but each one only touches `toc` nodes that match its kind.
 */
export function buildTocTransform(
  mdast: GenericParent,
  vfile: VFile,
  pages?: ProjectPage[],
  projectSlug?: string,
  currentSlug?: string,
) {
  const tocHeadings = selectAll('toc > heading', mdast);
  const tocsAndHeadings = selectAll('toc,heading', mdast).filter((item) => {
    // Do not include toc headings anywhere in this transform
    return !tocHeadings.includes(item);
  }) as GenericNode[];

  transformProjectTocs(vfile, tocsAndHeadings, pages, projectSlug);
  transformChildrenTocs(vfile, tocsAndHeadings, pages, projectSlug, currentSlug);
  transformPageTocs(vfile, tocsAndHeadings);
  transformSectionTocs(vfile, tocsAndHeadings);
}
