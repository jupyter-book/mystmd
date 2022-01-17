import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { Blocks } from '@curvenote/blocks';
import { Block, Version } from '../../models';
import { ArticleState } from './walkArticle';
import { getImageSrc } from './getImageSrc';

function contentTypeToExt(contentType: string): string {
  switch (contentType) {
    case 'image/gif':
      return 'gif';
    case 'image/png':
      return 'png';
    case 'image/jpg':
    case 'image/jpeg':
      return 'jpg';
    case 'application/json':
      return 'json';
    default:
      throw new Error(`ContentType: "${contentType}" is not recognized as an extension.`);
  }
}

function makeUniqueFilename(
  basePath: string,
  block: Block,
  content_type: string,
  version: Version<Blocks.Image | Blocks.Output>,
  taken: Set<string>,
): string {
  const ext = contentTypeToExt(content_type);
  const filenames = [
    block.data.name,
    'file_name' in version.data ? version.data.file_name : '', // Output doesn't have a filename
    `${version.id.project}-${version.id.block}-v${version.id.version}`,
  ]
    .map((filename) => {
      if (!filename) return '';
      let name = filename;
      if (!name.endsWith(ext)) name += `.${ext}`;
      const test = path.join(basePath, name);
      if (taken.has(test)) return '';
      return test;
    })
    .filter((n) => !!n);
  return filenames[0];
}

export async function writeImagesToFiles(
  images: ArticleState['images'],
  basePath: string,
  buildPath?: string,
) {
  const takenFilenames: Set<string> = new Set();
  const filenames: Record<string, string> = {};
  const p = await Promise.all(
    Object.entries(images).map(async ([key, image]) => {
      const [block] = await Promise.all([new Block(image.session, image.id).get(), image.get()]);
      const { src, content_type } = getImageSrc(image);
      if (!src || !content_type) return;
      const response = await fetch(src);
      const buffer = await response.buffer();
      const referencableFilename = makeUniqueFilename(
        basePath,
        block,
        content_type,
        image,
        takenFilenames,
      );
      const filename = path.join(buildPath ?? '', referencableFilename);
      if (!fs.existsSync(filename)) fs.mkdirSync(path.dirname(filename), { recursive: true });
      console.log(`Writing ${filename}`);
      fs.writeFileSync(filename, buffer);
      filenames[key] = referencableFilename;
      takenFilenames.add(referencableFilename);
    }),
  );

  return filenames;
}
