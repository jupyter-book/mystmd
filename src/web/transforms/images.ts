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

function hashUrl(url: string) {
  return createHash('md5').update(url).digest('hex');
}

function isUrl(url: string) {
  return url.toLowerCase().startsWith('http:') || url.toLowerCase().startsWith('https:');
}

export async function transformImages(mdast: Root, state: TransformState) {
  const images = selectAll('image', mdast) as GenericNode[];
  await Promise.all(
    images.map(async (image) => {
      const session = state.cache.session;
      const oxa = oxaLinkToId(image.url);
      let file: string;
      if (oxa) {
        // If oxa, get the download url
        const versionId = oxa?.block as VersionId;
        if (!versionId?.version) return;
        const url = `/blocks/${versionId.project}/${versionId.block}/versions/${versionId.version}`;
        session.log.debug(`Fetching image version: ${url}`);
        const { status, json } = await session.get(url);
        const downloadUrl = json.links?.download;
        if (status !== 200 || !downloadUrl) {
          session.log.debug(`Error fetching image version: ${url}`);
          return;
        }
        file = await downloadAndSave(downloadUrl, `${versionId.block}.${versionId.version}`, state);
      } else if (isUrl(image.url)) {
        // If not oxa, download the URL directly and save it to a file with a hashed name
        file = await downloadAndSave(image.url, hashUrl(image.url), state);
      } else {
        // Assume non-oxa, non-url paths are local images relative to the config.section.path
        const fullPath = path.join(state.folder, image.url);
        if (!fs.existsSync(fullPath)) {
          console.log(fs.readdirSync('./'));
          session.log.debug(`Cannot find image: ${fullPath}`);
          return;
        }
        file = `${hashUrl(fullPath)}${path.extname(fullPath)}`;
        try {
          fs.copyFileSync(fullPath, path.join(imagePath(state.cache.options), file));
          session.log.debug(`Image successfully copied: ${fullPath}`);
        } catch {
          session.log.debug(`Error copying image: ${fullPath}`);
        }
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
