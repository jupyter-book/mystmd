import fs from 'fs';
import mime from 'mime-types';
import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import fetch from 'node-fetch';
import { dirname, join, parse } from 'path';
import { oxaLinkToId, VersionId } from '@curvenote/blocks';
import { Root } from '../myst';
import { WebFileObject } from '../web/files';
import { computeHash, hashAndCopyStaticFile, staticPath, versionIdToURL } from '../utils';
import { ISession } from '../session/types';
import { PageFrontmatter } from '../frontmatter/types';
import { convertImageToWebp } from '../export/utils/imagemagick';

function isUrl(url: string) {
  return url.toLowerCase().startsWith('http:') || url.toLowerCase().startsWith('https:');
}

function isBase64(data: string) {
  return data.split(';base64,').length === 2;
}

export async function downloadAndSaveImage(
  session: ISession,
  url: string,
  file: string,
  fileFolder: string,
): Promise<string> {
  const exists = fs.existsSync(fileFolder);
  const fileMatch = exists && fs.readdirSync(fileFolder).find((f) => parse(f).name === file);
  if (exists && fileMatch) {
    session.log.debug(`Cached image found for: ${url}...`);
    return fileMatch;
  }
  const filePath = join(fileFolder, file);
  let extension: string | false = false;
  session.log.debug(`Fetching image: ${url}...\n  -> saving to: ${filePath}`);
  await fetch(url)
    .then(
      (res) =>
        new Promise((resolve, reject) => {
          extension = mime.extension(res.headers.get('content-type') || '');
          if (!extension) reject();
          if (!fs.existsSync(fileFolder)) fs.mkdirSync(fileFolder, { recursive: true });
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

export async function saveImageInStaticFolder(
  session: ISession,
  sourceUrl: string,
  filePath = '',
  opts?: { webp?: boolean },
): Promise<{ sourceUrl: string; url: string; webp?: string } | null> {
  const oxa = oxaLinkToId(sourceUrl);
  const imageLocalFile = join(filePath, sourceUrl);
  let file: string | undefined;
  const folder = staticPath(session);
  if (oxa) {
    // If oxa, get the download url
    const versionId = oxa?.block as VersionId;
    if (!versionId?.version) return null;
    const url = versionIdToURL(versionId);
    session.log.debug(`Fetching image version: ${url}`);
    const { ok, json } = await session.get(url);
    const downloadUrl = json.links?.download;
    if (!ok || !downloadUrl) {
      session.log.error(`Error fetching image version: ${url}`);
      return null;
    }
    file = await downloadAndSaveImage(
      session,
      downloadUrl,
      `${versionId.block}.${versionId.version}`,
      folder,
    );
  } else if (isUrl(sourceUrl)) {
    // If not oxa, download the URL directly and save it to a file with a hashed name
    file = await downloadAndSaveImage(session, sourceUrl, computeHash(sourceUrl), folder);
  } else if (fs.existsSync(imageLocalFile)) {
    // Non-oxa, non-url local image paths relative to the config.section.path
    file = hashAndCopyStaticFile(session, imageLocalFile);
    if (!file) return null;
  } else if (isBase64(sourceUrl)) {
    // Inline base64 images
    const fileObject = new WebFileObject(session.log, folder, '', true);
    await fileObject.writeBase64(sourceUrl);
    file = fileObject.id;
  } else {
    session.log.error(`Cannot find image "${sourceUrl}" in ${filePath}`);
    return null;
  }
  let webp: string | undefined;
  if (opts?.webp) {
    try {
      const result = await convertImageToWebp(session, join(folder, file));
      if (result) webp = `/_static/${result}`;
    } catch (error) {
      session.log.warn(`⚠️  Large image ${imageLocalFile} (${(error as any).message})`);
    }
  }
  // Update mdast with new file name
  const url = `/_static/${file}`;
  return { sourceUrl, url, webp };
}

export async function transformImages(session: ISession, mdast: Root, file: string) {
  const images = selectAll('image', mdast) as GenericNode[];
  return Promise.all(
    images.map(async (image) => {
      const result = await saveImageInStaticFolder(
        session,
        image.sourceUrl || image.url,
        dirname(file),
        { webp: true },
      );
      if (result) {
        // Update mdast with new file name
        const { sourceUrl, url, webp } = result;
        image.sourceUrl = sourceUrl;
        image.url = url;
        image.urlOptimized = webp;
      }
    }),
  );
}

export async function transformThumbnail(
  session: ISession,
  frontmatter: PageFrontmatter,
  mdast: Root,
  file: string,
) {
  let thumbnail = frontmatter.thumbnail;
  // If the thumbnail is explicitly null, don't add an image
  if (thumbnail === null) {
    session.log.debug(`${file}#frontmatter.thumbnail is explicitly null, not searching content.`);
    return;
  }
  if (!thumbnail) {
    // The thumbnail isn't found, grab it from the mdast
    const [image] = selectAll('image', mdast) as GenericNode[];
    if (!image) {
      session.log.debug(`${file}#frontmatter.thumbnail is not set, and there are no images.`);
      return;
    }
    session.log.debug(`${file}#frontmatter.thumbnail is being populated by the first image.`);
    thumbnail = image.sourceUrl || image.url;
  }
  if (!thumbnail) return;
  session.log.debug(`${file}#frontmatter.thumbnail Saving thumbnail in static folder.`);
  const result = await saveImageInStaticFolder(session, thumbnail, dirname(file), { webp: true });
  if (result) {
    // Update frontmatter with new file name
    const { url, webp } = result;
    frontmatter.thumbnail = url;
    frontmatter.thumbnailOptimized = webp;
  }
}
