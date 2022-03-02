import type { GenericParent } from 'mystjs';
import type { References } from '~/components/ReferencesProvider';

export type Frontmatter = {
  title?: string;
  author?: string[];
};

export type PageLoader = {
  frontmatter: Frontmatter;
  mdast: GenericParent;
  references: References;
};

export async function getData(
  folderName?: string,
  slug?: string,
): Promise<PageLoader | null> {
  if (!folderName || !slug) return null;
  // TODO: only import this on development
  const content = await import('~/content');
  return content.getData(folderName, slug);
}
