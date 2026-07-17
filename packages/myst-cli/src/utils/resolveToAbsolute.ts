import fs from 'node:fs';
import { extname, resolve } from 'node:path';
import { computeHash, isUrl } from 'myst-cli-utils';
import type { ISession } from '../session/types.js';
import { cachePath, loadFromCache, writeToCache } from '../session/cache.js';

/**
 * Resolve a path to an absolute local path, with optional remote URL fetching.
 *
 * When `allowRemote` is set and the input is a URL, the content is fetched and
 * cached locally, and the returned path points to that cached file.
 */
export async function resolveToAbsolute(
  session: ISession,
  basePath: string,
  relativePath: string,
  opts?: {
    allowNotExist?: boolean;
    allowRemote?: boolean;
  },
) {
  let message: string | undefined;
  if (opts?.allowRemote && isUrl(relativePath)) {
    const cacheFilename = `config-item-${computeHash(relativePath)}${extname(new URL(relativePath).pathname)}`;
    if (!loadFromCache(session, cacheFilename, { maxAge: 30 })) {
      try {
        const resp = await session.fetch(relativePath);
        if (resp.ok) {
          writeToCache(session, cacheFilename, Buffer.from(await resp.arrayBuffer()));
        } else {
          message = `Bad response from config URL: ${relativePath}`;
        }
      } catch {
        message = `Error fetching config URL: ${relativePath}`;
      }
    }
    relativePath = cachePath(session, cacheFilename);
  }
  try {
    const absPath = resolve(basePath, relativePath);
    if (opts?.allowNotExist || fs.existsSync(absPath)) {
      return absPath;
    }
    message = message ?? `Does not exist as local path: ${absPath}`;
  } catch {
    message = message ?? `Unable to resolve as local path: ${relativePath}`;
  }
  session.log.debug(message);
  return relativePath;
}
