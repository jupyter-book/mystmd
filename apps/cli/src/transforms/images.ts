import fs from 'fs';
import type { Root } from 'mdast';
import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import path from 'path';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { ISession } from '../session/types';
import { convertImageToWebp } from '../export/utils/imagemagick';

export async function transformWebp(
  session: ISession,
  mdast: Root,
  frontmatter: PageFrontmatter,
  writeFolder: string,
) {
  const convertedToWebp: Record<string, string> = {};
  await Promise.all(
    fs.readdirSync(writeFolder).map(async (file) => {
      try {
        const result = await convertImageToWebp(session, path.join(writeFolder, file));
        if (result) convertedToWebp[file] = result;
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
    }),
  );

  const images = selectAll('image', mdast) as GenericNode[];
  images.forEach((image) => {
    if (image.url) {
      Object.entries(convertedToWebp).forEach(([original, webp]) => {
        if (image.url.endsWith(original)) {
          image.urlOptimized = image.url.replace(original, webp);
        }
      });
    }
  });
  if (frontmatter.thumbnail) {
    Object.entries(convertedToWebp).forEach(([original, webp]) => {
      if (frontmatter.thumbnail?.endsWith(original)) {
        frontmatter.thumbnailOptimized = frontmatter.thumbnail.replace(original, webp);
      }
    });
  }
}
