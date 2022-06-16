import fs from 'fs';
import mime from 'mime-types';
import { GenericNode, selectAll } from 'mystjs';
import fetch from 'node-fetch';
import path from 'path';
import { oxaLinkToId, VersionId } from '@curvenote/blocks';
import { Root } from '../myst';
import { WebFileObject } from '../web/files';
import { computeHash, hashAndCopyStaticFile, staticPath, versionIdToURL } from '../utils';
import { ISession } from '../session/types';

function isUrl(url: string) {
  return url.toLowerCase().startsWith('http:') || url.toLowerCase().startsWith('https:');
}

function isBase64(data: string) {
  return data.split(';base64,').length === 2;
}

async function downloadAndSave(session: ISession, url: string, file: string): Promise<string> {
  const fileFolder = staticPath(session);
  const fileMatch = fs.readdirSync(fileFolder).find((f) => path.parse(f).name === file);
  if (fileMatch) {
    session.log.debug(`Cached image found for: ${url}...`);
    return fileMatch;
  }
  const filePath = path.join(staticPath(session), file);
  let extension: string | false = false;
  session.log.debug(`Fetching image: ${url}...\n  -> saving to: ${filePath}`);
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
    .catch(() => session.log.error(`Error saving image "${url}" to: ${filePath}`));
  return extension ? `${file}.${extension}` : file;
}

export async function transformImages(session: ISession, mdast: Root, filePath: string) {
  const images = selectAll('image', mdast) as GenericNode[];
  return Promise.all(
    images.map(async (image) => {
      const oxa = oxaLinkToId(image.url);
      const imageLocalFile = path.join(filePath, image.url);
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
        file = await downloadAndSave(
          session,
          downloadUrl,
          `${versionId.block}.${versionId.version}`,
        );
      } else if (isUrl(image.url)) {
        // If not oxa, download the URL directly and save it to a file with a hashed name
        file = await downloadAndSave(session, image.url, computeHash(image.url));
      } else if (fs.existsSync(imageLocalFile)) {
        // Non-oxa, non-url local image paths relative to the config.section.path
        file = hashAndCopyStaticFile(session, imageLocalFile);
      } else if (isBase64(image.url)) {
        // Inline base64 images
        const fileObject = new WebFileObject(session.log, staticPath(session), '', true);
        await fileObject.writeBase64(image.url);
        file = fileObject.id;
      } else {
        session.log.error(`Cannot find image "${image.url}" in ${filePath}`);
        return;
      }
      // Update mdast with new file name
      image.url = `/_static/${file}`;
    }),
  );
}
