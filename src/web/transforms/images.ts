import { oxaLinkToId, VersionId } from '@curvenote/blocks';
import { GenericNode, selectAll } from 'mystjs';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { createHash } from 'crypto';

import { Root, TransformState } from './types';
import { Options } from '../types';

export function serverPath(opts: Options) {
  const buildPath = opts.buildPath || '_build';
  return `${buildPath}/web`;
}

export function publicPath(opts: Options) {
  return path.join(serverPath(opts), 'public');
}

export function imagePath(opts: Options) {
  return path.join(publicPath(opts), '_static');
}

export async function transformImages(mdast: Root, state: TransformState) {
  const images = selectAll('image', mdast) as GenericNode[];
  await Promise.all(
    images.map(async (image) => {
      const oxa = oxaLinkToId(image.url);
      const isUrl =
        image.url.toLowerCase().startsWith('http:') || image.url.toLowerCase().startsWith('https:');
      // Assume non-oxa, non-url paths are local images correctly placed in the images/ folder
      if (!oxa && !isUrl) {
        image.url = `/_static/${path.basename(image.url)}`;
        return;
      }
      let file: string;
      if (!oxa) {
        // If not oxa, download the URL directly and save it to a file with a hashed name
        file = await downloadAndSave(
          image.url,
          createHash('md5').update(image.url).digest('hex'),
          state,
        );
      } else {
        // If oxa, get the download url
        const versionId = oxa?.block as VersionId;
        if (!versionId?.version) return;
        const url = `/blocks/${versionId.project}/${versionId.block}/versions/${versionId.version}`;
        const session = state.cache.session;
        session.log.debug(`Fetching image version: ${url}`);
        const { status, json } = await session.get(url);
        const downloadUrl = json.links?.download;
        if (status !== 200 || !downloadUrl) {
          session.log.debug(`Error fetching image version: ${url}`);
          return;
        }
        file = await downloadAndSave(downloadUrl, `${versionId.block}.${versionId.version}`, state);
      }
      // Update mdast with new file name
      image.url = `/_static/${file}`;
    }),
  );
}

async function downloadAndSave(url: string, file: string, state: TransformState): Promise<string> {
  const filePath = path.join(imagePath(state.cache.options), file);
  const session = state.cache.session;
  let extension: string | false = false;
  session.log.debug(`Fetching image: ${url.slice(0, 31)}...\n  -> saving to: ${filePath}`);
  await fetch(url)
    .then(
      (res) =>
        new Promise((resolve, reject) => {
          extension = mime.extension(res.headers.get('content-type') || '');
          if (!extension) reject();
          const fileStream = fs.createWriteStream(`${filePath}.${extension}`);
          res.body.pipe(fileStream);
          res.body.on('error', reject);
          fileStream.on('finish', resolve);
        }),
    )
    .then(() => session.log.debug(`Image successfully saved to: ${filePath}`))
    .catch(() => session.log.debug(`Error saving image to: ${filePath}`));
  return extension ? `${file}.${extension}` : file;
}
