import fs from 'fs';
import path from 'path';
import type { GenericNode } from 'mystjs';
import { selectAll } from 'mystjs';
import pLimit from 'p-limit';
import fetch from 'node-fetch';
import type { OxaLink } from '@curvenote/blocks';
import { oxaLink, oxaLinkToId } from '@curvenote/blocks';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import type { Root } from '../myst';
import { addWarningForFile, hashAndCopyStaticFile, tic } from '../utils';
import { links } from '../store/build';
import { selectLinkStatus } from '../store/build/selectors';
import type { ExternalLinkResult } from '../store/build';

// These limit access from command line tools by default
const skippedDomains = ['www.linkedin.com', 'linkedin.com', 'medium.com', 'twitter.com'];

async function checkLink(session: ISession, url: string): Promise<ExternalLinkResult> {
  const cached = selectLinkStatus(session.store.getState(), url);
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

/**
 * Populate link node with rich oxa info
 */
function mutateOxaLink(session: ISession, file: string, link: GenericNode, oxa: OxaLink) {
  link.oxa = oxa;
  const key = oxaLink(oxa, false) as string;
  const info = selectors.selectOxaLinkInformation(session.store.getState(), key);
  if (!info) {
    addWarningForFile(session, file, `Information for oxa.link not found: ${key}`);
  }
  const url = info?.url;
  if (url && url !== link.url) {
    // the `internal` flag is picked up in the link renderer (prefetch!)
    link.internal = true;
    link.url = url;
    if (link.type === 'linkBlock') {
      // Any values already present on the block override link info
      link.title = link.title || info.title;
      if (!link.children || link.children.length === 0) {
        link.children = [{ type: 'text', value: info.description || '' }];
      }
      link.thumbnail = link.thumbnail || info.thumbnail;
    }
  }
}

function updateLinkTextIfEmpty(link: GenericNode, title?: string) {
  if (!link.children || link.children?.length === 0) {
    // If there is nothing in the link, give it a title
    link.children = [{ type: 'text', value: title }];
  }
}

/**
 * Replace relative file link with resolved site path
 */
function mutateRelativeLink(
  link: GenericNode,
  sitePath: string,
  target?: string[],
  title?: string,
) {
  if (!link.urlSource) link.urlSource = link.url;
  link.url = [sitePath, ...(target || [])].join('#');
  link.internal = true;
  updateLinkTextIfEmpty(link, title);
}

/**
 * Copy relative file to static folder and replace with absolute link
 */
function mutateStaticLink(session: ISession, link: GenericNode, linkFile: string) {
  const file = hashAndCopyStaticFile(session, linkFile);
  if (!file) return;
  if (!link.urlSource) link.urlSource = link.url;
  link.url = `/_static/${file}`;
  link.static = true;
}

const limitOutgoingConnections = pLimit(25);

export async function transformLinks(
  session: ISession,
  file: string,
  mdast: Root,
  opts?: { checkLinks?: boolean },
): Promise<string[]> {
  const linkNodes = selectAll('link,linkBlock', mdast) as GenericNode[];
  linkNodes.forEach((link) => {
    const urlSource = link.urlSource || link.url;
    const oxa = link.oxa || oxaLinkToId(urlSource);
    if (oxa) {
      mutateOxaLink(session, file, link, oxa);
      return;
    }
    if (link.url === '' || link.url.startsWith('#')) {
      link.internal = true;
      return;
    }
    const linkFileWithTarget = fileFromRelativePath(urlSource, file);
    if (linkFileWithTarget) {
      const [linkFile, ...target] = linkFileWithTarget.split('#');
      const { url, title } = selectors.selectFileInfo(session.store.getState(), linkFile) || {};
      if (url != null) {
        mutateRelativeLink(link, url, target, title ?? '');
      } else {
        mutateStaticLink(session, link, linkFile);
      }
      return;
    }
  });
  const linkUrls = linkNodes
    .filter((link) => !(link.internal || link.static))
    .map((link) => link.url as string);
  if (!opts?.checkLinks || linkUrls.length === 0) return linkUrls;
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
