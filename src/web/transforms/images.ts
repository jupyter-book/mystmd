import { oxaLinkToId, VersionId } from '@curvenote/blocks';
import { GenericNode, selectAll } from 'mystjs';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

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
      // Leave non-oxa URLs alone
      if (!oxa && isUrl) return;
      // Assume remaining non-oxa paths are local images
      if (!oxa) {
        image.url = `/_static/${path.basename(image.url)}`;
        return;
      }
      // Otherwise, fetch oxa image and save locally
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
      let extension: string | false = path.extname(json.file_name || '').slice(1);
      if (!extension && json.content_type) {
        const contentType = mime.contentType(json.content_type);
        if (contentType) {
          extension = mime.extension(contentType);
        }
      }
      if (!extension) {
        session.log.debug(`Cannot determine content type of: ${url}`);
        return;
      }
      const file = `${versionId.block}.${versionId.version}.${extension}`;
      const filePath = path.join(imagePath(state.cache.options), file);
      session.log.debug(
        `Fetching image: ${downloadUrl.slice(0, 31)}...\n  -> saving to: ${filePath}`,
      );
      await fetch(downloadUrl)
        .then(
          (res) =>
            new Promise((resolve, reject) => {
              const fileStream = fs.createWriteStream(filePath);
              res.body.pipe(fileStream);
              res.body.on('error', reject);
              fileStream.on('finish', resolve);
            }),
        )
        .then(() => {
          image.url = `/_static/${file}`;
          session.log.debug(`Image successfully saved to: ${filePath}`);
        })
        .catch(() => session.log.debug(`Error saving image to: ${filePath}`));
    }),
  );
}
