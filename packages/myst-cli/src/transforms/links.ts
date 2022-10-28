import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import fetch from 'node-fetch';
import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import { updateLinkTextIfEmpty } from 'myst-transforms';
import type { LinkTransformer, Link } from 'myst-transforms';
import { fileError } from 'myst-common';
import { tic } from 'myst-cli-utils';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import type { Root } from 'mdast';
import { addWarningForFile, hashAndCopyStaticFile } from '../utils';
import { links } from '../store/reducers';
import type { ExternalLinkResult } from '../store/types';

// These limit access from command line tools by default
const skippedDomains = [
  'www.linkedin.com',
  'linkedin.com',
  'medium.com',
  'twitter.com',
  'en.wikipedia.org',
];

async function checkLink(session: ISession, url: string): Promise<ExternalLinkResult> {
  const cached = selectors.selectLinkStatus(session.store.getState(), url);
  if (cached) return cached;
  const link: ExternalLinkResult = {
    url,
  };
  if (url.startsWith('mailto:')) {
    link.skipped = true;
    session.log.debug(`Skipping: ${url}`);
    session.store.dispatch(links.actions.updateLink(link));
    return link;
  }
  try {
    const parsedUrl = new URL(url);
    if (skippedDomains.includes(parsedUrl.hostname)) {
      link.skipped = true;
      session.log.debug(`Skipping: ${url}`);
      session.store.dispatch(links.actions.updateLink(link));
      return link;
    }
    session.log.debug(`Checking that "${url}" exists`);
    const resp = await fetch(url);
    link.ok = resp.ok;
    link.status = resp.status;
    link.statusText = resp.statusText;
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    session.log.debug(`Error fetching ${url} ${(error as Error).message}`);
    link.ok = false;
  }
  session.store.dispatch(links.actions.updateLink(link));
  return link;
}

type LinkInfo = {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
};

export type LinkLookup = Record<string, LinkInfo>;

/**
 * Compute link node file path relative to site root (currently, only the working directory)
 *
 * If path has no extension, this function looks for .md then .ipynb.
 * If a '#target' is present at the end of the path, it is maintained.
 * If file does not exists, returns undefined.
 *
 * @param pathFromLink Path from link node URL relative to file where it is defined
 * @param file File where link is defined
 * @param sitePath Root path of site / session; from here all relative paths in the store are defined
 */
export function fileFromRelativePath(
  pathFromLink: string,
  file?: string,
  sitePath?: string,
): string | undefined {
  let target: string[];
  [pathFromLink, ...target] = pathFromLink.split('#');
  // The URL is encoded (e.g. %20 --> space)
  pathFromLink = decodeURIComponent(pathFromLink);
  if (!sitePath) sitePath = '.';
  if (file) {
    pathFromLink = path.relative(sitePath, path.resolve(path.dirname(file), pathFromLink));
  }
  if (fs.existsSync(pathFromLink) && fs.lstatSync(pathFromLink).isDirectory()) {
    // This should only return true for files
    return undefined;
  }
  if (!fs.existsSync(pathFromLink)) {
    if (fs.existsSync(`${pathFromLink}.md`)) {
      pathFromLink = `${pathFromLink}.md`;
    } else if (fs.existsSync(`${pathFromLink}.ipynb`)) {
      pathFromLink = `${pathFromLink}.ipynb`;
    } else {
      return undefined;
    }
  }
  return [pathFromLink, ...target].join('#');
}

export class StaticFileTransformer implements LinkTransformer {
  protocol = 'file';
  session: ISession;
  filePath: string;

  constructor(session: ISession, filePath: string) {
    this.session = session;
    this.filePath = filePath;
  }
  test(url?: string) {
    if (!url) return false;
    const linkFileWithTarget = fileFromRelativePath(url, this.filePath);
    return !!linkFileWithTarget;
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const linkFileWithTarget = fileFromRelativePath(urlSource, this.filePath);
    if (!linkFileWithTarget) {
      // Not raising a warning here, this should be caught in the test above
      return false;
    }
    const [linkFile, ...target] = linkFileWithTarget.split('#');
    const { url, title } = selectors.selectFileInfo(this.session.store.getState(), linkFile) || {};
    if (url != null) {
      // Replace relative file link with resolved site path
      // TODO: lookup the and resolve the hash as well
      link.url = [url, ...(target || [])].join('#');
      link.internal = true;
    } else {
      // Copy relative file to static folder and replace with absolute link
      const copiedFile = hashAndCopyStaticFile(this.session, linkFile, this.session.staticPath());
      if (!copiedFile) {
        fileError(file, `Error copying file ${urlSource}`, {
          node: link,
          source: 'StaticFileTransformer',
        });
        return false;
      }
      link.url = `/_static/${copiedFile}`;
      link.static = true;
    }
    updateLinkTextIfEmpty(link, title || path.basename(linkFile));
    return true;
  }
}

const limitOutgoingConnections = pLimit(25);

export async function checkLinksTransform(
  session: ISession,
  file: string,
  mdast: Root,
): Promise<string[]> {
  const linkNodes = selectAll('link,linkBlock,card', mdast) as GenericNode[];
  const linkUrls = linkNodes
    .filter((link) => !(link.internal || link.static))
    .map((link) => link.url as string);
  if (linkUrls.length === 0) return linkUrls;
  const toc = tic();
  const plural = linkUrls.length > 1 ? 's' : '';
  session.log.info(`🔗 Checking ${linkUrls.length} link${plural} in ${file}`);
  const linkResults = await Promise.all(
    linkUrls.map(async (url) =>
      limitOutgoingConnections(async () => {
        const check = await checkLink(session, url);
        if (check.ok || check.skipped) return url as string;
        const status = check.status ? ` (${check.status}, ${check.statusText})` : '';
        addWarningForFile(session, file, `Link for "${url}" did not resolve.${status}`, 'error');
        return url as string;
      }),
    ),
  );
  session.log.info(toc(`🔗 Checked ${linkUrls.length} link${plural} in ${file} in %s`));
  return linkResults;
}
