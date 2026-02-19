import type { ISession } from '../session/types.js';
import fs from 'node:fs';
import nodePath from 'node:path';
import mime from 'mime-types';
import { EXT_REQUEST_HEADERS } from '../utils/headers.js';
import { POSIX_REGEX_SOURCE } from 'picomatch/lib/constants.js';

function rewriteGitHubURL(url: string): string {
  const GITHUB_BLOB = /^(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)\/blob\//;
  return url.replace(GITHUB_BLOB, 'https://raw.githubusercontent.com/$1/$2/');
}

/**
 * Fetch remote asset and write to disk.
 *
 * @param session session object
 * @param url remote URL to fetch
 * @param path destination directory to write to
 * @param stem filename stem for the target file
 */
export async function fetchRemoteAsset(
  session: ISession,
  url: string,
  path: string,
  stem: string,
  opts?: {
    extension?: string;
  },
): Promise<{ name: string; contentType: string }> {
  const finalURL = rewriteGitHubURL(url);
  const res = await session.fetch(finalURL, { headers: EXT_REQUEST_HEADERS });

  let extension: string;
  let contentType: string;

  // Prefer provided extension
  if (opts?.extension !== undefined) {
    extension = opts.extension;

    // Determine content-type for this extension
    const extMimeType = mime.contentType(extension);
    if (extMimeType === false) {
      throw new Error(`Unknown content-type found for extension ${extension}.`);
    }
    contentType = extMimeType;
  } else {
    const rawContentType = res.headers.get('content-type');
    if (rawContentType === null) {
      throw new Error(`Unknown content-type found for URL ${url}.`);
    }
    contentType = rawContentType;

    const mimeExt = mime.extension(contentType);
    if (mimeExt === false) {
      throw new Error(`Unknown content-type found for extension ${mimeExt}.`);
    }
    extension = mimeExt;
  }

  //
  // Ensure that destination directory exists
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  const destName = `${stem}.${extension}`;
  const destPath = nodePath.join(path, destName);

  // Write to a file
  const fileStream = fs.createWriteStream(destPath);
  await new Promise((resolve, reject) => {
    if (!res.body) {
      reject(`no response body from ${finalURL}`);
    } else {
      res.body.pipe(fileStream);
      res.body.on('error', reject);
      fileStream.on('finish', resolve as () => void);
    }
  });
  await new Promise((r) => setTimeout(r, 50));
  session.log.debug(`Image successfully saved to: ${destName}`);
  return { name: destName, contentType };
}
