import { oxaLinkToId, VersionId } from '@curvenote/blocks';
import { GenericNode, selectAll } from 'mystjs';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

import { Root, TransformState } from './types';
import { Options } from '../types';
import { computeHash, WebFileObject } from '../files';
import { versionIdToURL } from '../../utils';

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

function isUrl(url: string) {
  return url.toLowerCase().startsWith('http:') || url.toLowerCase().startsWith('https:');
}

function isBase64(data: string) {
  return data.split(';base64,').length === 2;
}

async function downloadAndSave(url: string, file: string, state: TransformState): Promise<string> {
  const filePath = path.join(imagePath(state.cache.options), file);
  const { session } = state.cache;
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
    .catch(() => session.log.error(`Error saving image "${url.slice(0, 31)}" to: ${filePath}`));
  return extension ? `${file}.${extension}` : file;
}

export async function transformImages(mdast: Root, state: TransformState) {
  const images = selectAll('image', mdast) as GenericNode[];
  return Promise.all(
    images.map(async (image) => {
      const { session } = state.cache;
      const oxa = oxaLinkToId(image.url);
      let file: string;
      if (oxa) {
        // If oxa, get the download url
        const versionId = oxa?.block as VersionId;
        if (!versionId?.version) return;
        const url = versionIdToURL(versionId);
        session.log.debug(`Fetching image version: ${url}`);
        const { ok, json } = await session.get(url);
        const downloadUrl = json.links?.download;
        if (!ok || !downloadUrl) {
          session.log.error(`Error fetching image version: ${url}`);
          return;
        }
        file = await downloadAndSave(downloadUrl, `${versionId.block}.${versionId.version}`, state);
      } else if (isUrl(image.url)) {
        // If not oxa, download the URL directly and save it to a file with a hashed name
        file = await downloadAndSave(image.url, computeHash(image.url), state);
      } else if (fs.existsSync(image.url)) {
        // Non-oxa, non-url local image paths relative to the config.section.path
        file = `${computeHash(image.url)}${path.extname(image.url)}`;
        try {
          fs.copyFileSync(image.url, path.join(imagePath(state.cache.options), file));
          session.log.debug(`Image successfully copied: ${image.url}`);
        } catch {
          session.log.error(`Error copying image: ${image.url}`);
        }
      } else if (isBase64(image.url)) {
        // Inline base64 images
        const fileObject = new WebFileObject(session.log, imagePath(state.cache.options), '', true);
        await fileObject.writeBase64(image.url);
        file = fileObject.id;
      } else {
        session.log.error(`Cannot find image: ${image.url}`);
        return;
      }
      // Update mdast with new file name
      image.url = `/_static/${file}`;
    }),
  );
}
