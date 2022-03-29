import { Config } from './types';
import { FooterLinks, Heading, NavigationLink } from './types';

export function getSection(config?: Config, sectionNumber?: number) {
  if (sectionNumber == null) return undefined;
  return config?.site.sections[sectionNumber];
}

export function getFolder(config?: Config, folderName?: string | number) {
  if (!config) return undefined;
  if (typeof folderName === 'number') {
    folderName = getSection(config, folderName)?.folder;
  }
  if (!folderName || !(folderName in config.folders)) return undefined;
  return config.folders[folderName as keyof typeof config.folders];
}

export function getFolderPages(
  config?: Config,
  folderName?: string,
  opts = { addGroups: false },
): Heading[] | undefined {
  const folder = getFolder(config, folderName);
  if (!folder) return undefined;
  const headings: Heading[] = [
    {
      title: folder.title,
      slug: folder.index,
      path: `/${folderName}`,
      level: 'index',
    },
    ...folder.pages.map((p) => {
      if (!p.slug) return p;
      return { ...p, path: `/${folderName}/${p.slug}` };
    }),
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
  currentSlug: string,
  headings?: Heading[],
): NavigationLink | undefined {
  if (!headings) return undefined;
  const linkIndex = headings.findIndex(({ slug }) => !!slug && slug !== currentSlug);
  const link = headings[linkIndex];
  if (!link?.path) return undefined;
  return {
    title: link.title,
    url: link.path,
    group: link.group,
  };
}

export function getFooterLinks(
  config?: Config,
  folderName?: string,
  slug?: string,
): FooterLinks {
  if (!folderName || !slug || !config) return {};
  const pages = getFolderPages(config, folderName, {
    addGroups: true,
  });
  const found = pages?.findIndex(({ slug: s }) => s === slug) ?? -1;
  if (found === -1) return {};
  const prev = getHeadingLink(slug, pages?.slice(0, found).reverse());
  const next = getHeadingLink(slug, pages?.slice(found + 1));
  const footer: FooterLinks = {
    navigation: { prev, next },
  };
  return footer;
}
