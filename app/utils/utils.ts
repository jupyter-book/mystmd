import { ManifestProject, SiteManifest } from './types';
import { FooterLinks, Heading, NavigationLink } from './types';

export function getSection(config?: SiteManifest, sectionNumber?: number) {
  if (sectionNumber == null) return undefined;
  return config?.projects[sectionNumber];
}

export function getFolder(config?: SiteManifest, folderName?: string | number) {
  if (!config) return undefined;
  if (typeof folderName === 'number') {
    folderName = getSection(config, folderName)?.slug;
  }
  const folderLookup: Record<string, ManifestProject> = {};
  config.projects.forEach((p) => (folderLookup[p.slug] = p));
  if (!folderName || !(folderName in folderLookup)) {
    return undefined;
  }
  return folderLookup[folderName];
}

export function getFolderPages(
  config?: SiteManifest,
  folderName?: string,
  opts = { addGroups: false },
): Heading[] | undefined {
  const folder = getFolder(config, folderName);
  if (!folder) return undefined;
  const headings: Heading[] = [
    {
      title: folder.title,
      slug: folder.slug,
      path: `/${folder.slug}`,
      level: 'index',
    },
    ...folder.pages.map((p) => {
      if (!('slug' in p)) return p;
      return { ...p, path: `/${folder.slug}/${p.slug}` };
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
  config?: SiteManifest,
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

export function copyTextToClipboard(text: string) {
  return new Promise<void>((res, rej) => {
    navigator.clipboard.writeText(text).then(
      () => {
        res();
      },
      (err) => {
        rej(err);
      },
    );
  });
}
