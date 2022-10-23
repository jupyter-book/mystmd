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
  const writeFolderContents = fs.readdirSync(writeFolder);
  const images = selectAll('image', mdast) as GenericNode[];
  await Promise.all(
    images.map(async (image) => {
      if (!image.url) return;
      const fileMatch = writeFolderContents.find((file) => image.url.endsWith(file));
      if (!fileMatch) return;
      try {
        const result = await convertImageToWebp(session, path.join(writeFolder, fileMatch));
        if (result) image.urlOptimized = image.url.replace(fileMatch, result);
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
    }),
  );

  if (frontmatter.thumbnail) {
    const fileMatch = writeFolderContents.find((file) => frontmatter.thumbnail?.endsWith(file));
    if (fileMatch) {
      try {
        const result = await convertImageToWebp(session, path.join(writeFolder, fileMatch));
        if (result) {
          frontmatter.thumbnailOptimized = frontmatter.thumbnail.replace(fileMatch, result);
        }
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
    }
  }
}
