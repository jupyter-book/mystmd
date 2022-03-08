import fs from 'fs';
import path from 'path';
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
  return JSON.parse(contents);
}
