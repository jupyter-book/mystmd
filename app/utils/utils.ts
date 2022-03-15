import config from '~/config.json';
import { FooterLinks, Heading, NavigationLink } from './types';

export function getFolder(folderName?: string) {
  if (!folderName || !(folderName in config.folders)) return undefined;
  return config.folders[folderName as keyof typeof config.folders];
}

export function getFolderPages(
  folderName?: string,
  opts = { useIndexSlug: false, addGroups: false },
): Heading[] | undefined {
  const folder = getFolder(folderName);
  if (!folder) return undefined;
  const headings: Heading[] = [
    {
      title: folder.title,
      slug: opts.useIndexSlug ? folder.index : `/${folderName}`,
      level: 'index',
    },
    ...folder.pages,
  ];
  if (opts.addGroups) {
    let lastTitle = folder.title;
    return headings.map((heading) => {
      if (!heading.slug || heading.level === 'index') {
        lastTitle = heading.title;
      }
      return { ...heading, group: lastTitle };
    });
  }
  return headings;
}

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

export function getFooterLinks(folderName?: string, slug?: string): FooterLinks {
  if (!folderName || !slug) return {};
  const pages = getFolderPages(folderName, { useIndexSlug: true, addGroups: true });
  const found = pages?.findIndex(({ slug: s }) => s === slug) ?? -1;
  if (found === -1) return {};
  const prev = getHeadingLink(folderName, slug, pages?.slice(0, found).reverse());
  const next = getHeadingLink(folderName, slug, pages?.slice(found + 1));
  const footer: FooterLinks = {
    navigation: { prev, next },
  };
  return footer;
}
