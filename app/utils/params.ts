import config from '~/config.json';

export type Heading = {
  slug?: string;
  title: string;
  level: number | 'index';
  group?: string;
};

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
