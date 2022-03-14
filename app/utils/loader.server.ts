import fs from 'fs';
import path from 'path';
import type { GenericParent } from 'mystjs';
import type { References } from '~/components/ReferencesProvider';
import { Heading, getFolderPages } from './params';

export type NavigationLink = {
  group?: string;
  title: string;
  url: string;
};

export type FooterLinks = {
  navigation?: {
    prev?: NavigationLink;
    next?: NavigationLink;
  };
};

export type Frontmatter = {
  title?: string;
  author?: string[];
};

export type PageLoader = {
  frontmatter: Frontmatter;
  mdast: GenericParent;
  references: References;
  footer?: FooterLinks;
};

function getHeadingLink(
  folderName: string,
  currentSlug: string,
  headings?: Heading[],
): NavigationLink | undefined {
  if (!headings) return undefined;
  const linkIndex = headings.findIndex(({ slug }) => !!slug && slug !== currentSlug);
  const link = headings[linkIndex];
  if (!link) return undefined;
  return {
    title: link.title,
    url: `/${folderName}/${link.slug}`,
    group: link.group,
  };
}

function getFooter(folderName: string, slug: string): FooterLinks {
  const pages = getFolderPages(folderName, { useIndexSlug: true, addGroups: true });
  const found = pages?.findIndex(({ slug: s }) => s === slug) ?? -1;
  const prev = getHeadingLink(folderName, slug, pages?.slice(0, found).reverse());
  const next = getHeadingLink(folderName, slug, pages?.slice(found + 1));
  const footer: FooterLinks = {
    navigation: { prev, next },
  };
  return footer;
}

export async function getData(
  folderName?: string,
  slug?: string,
): Promise<PageLoader | null> {
  if (!folderName || !slug) return null;
  // TODO: only import this on development
  const filename = path.join(
    __dirname, // This is executed in the API directory
    '..',
    'app',
    'content',
    folderName,
    `${slug}.json`,
  );
  if (!fs.existsSync(filename)) return null;
  const contents = fs.readFileSync(filename).toString();
  const data = JSON.parse(contents);
  const footer = getFooter(folderName, slug);
  return { ...data, footer };
}
