import fs from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import type { GenericNode, GenericParent } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { updateLinkTextIfEmpty } from 'myst-transforms';
import type { LinkTransformer } from 'myst-transforms';
import { RuleId, fileError, normalizeLabel, plural } from 'myst-common';
import { computeHash, hashAndCopyStaticFile, tic } from 'myst-cli-utils';
import type { CrossReference, Link } from 'myst-spec-ext';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { links } from '../store/reducers.js';
import type { ExternalLinkResult } from '../store/types.js';
import { EXT_REQUEST_HEADERS } from '../utils/headers.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { loadFromCache, writeToCache } from '../session/cache.js';

const LINK_MAX_AGE = 30; // in days

// These limit access from command line tools by default
const skippedDomains = [
  'www.linkedin.com',
  'linkedin.com',
  'medium.com',
  'twitter.com',
  'en.wikipedia.org',
];

function checkLinkCacheFilename(url: string) {
  return `checkLink-${computeHash(url)}.json`;
}

export async function checkLink(session: ISession, url: string): Promise<ExternalLinkResult> {
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
    const filename = checkLinkCacheFilename(url);
    const linkCache = loadFromCache(session, filename, { maxAge: LINK_MAX_AGE });
    const resp = linkCache
      ? JSON.parse(linkCache)
      : await session.fetch(url, { headers: EXT_REQUEST_HEADERS });
    link.ok = resp.ok;
    link.status = resp.status;
    link.statusText = resp.statusText;
    if (link.ok && !linkCache) {
      writeToCache(session, filename, JSON.stringify(link));
    }
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
export function fileFromRelativePath(pathFromLink: string, file?: string): string | undefined {
  let target: string[];
  [pathFromLink, ...target] = pathFromLink.split('#');
  // The URL is encoded (e.g. %20 --> space)
  pathFromLink = decodeURIComponent(pathFromLink);
  if (file) {
    pathFromLink = path.resolve(path.dirname(file), pathFromLink);
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
    const [linkFile] = linkFileWithTarget.split('#');
    const target = linkFileWithTarget.slice(linkFile.length + 1);
    const reference = normalizeLabel(target);
    const { url, title, dataUrl } =
      selectors.selectFileInfo(this.session.store.getState(), linkFile) || {};
    // If the link is non-static, and can be resolved locally
    if (url != null && link.static !== true) {
      if (dataUrl) link.dataUrl = dataUrl;
      if (reference) {
        // Change the link into a cross-reference!
        const xref = link as unknown as CrossReference;
        xref.type = 'crossReference';
        xref.identifier = reference.identifier;
        xref.label = reference.label;
        xref.url = url;
        xref.remote = true;
        return true;
      } else {
        // Replace relative file link with resolved site path
        link.url = [url, ...(target || [])].join('#');
        link.internal = true;
      }
    } else {
      // Copy relative file to static folder and replace with absolute link
      const copiedFile = hashAndCopyStaticFile(
        this.session,
        linkFile,
        this.session.publicPath(),
        (m: string) => {
          fileError(file, m, {
            node: link,
            source: 'StaticFileTransformer',
            ruleId: RuleId.staticFileCopied,
          });
        },
      );
      if (!copiedFile) return false;
      link.url = `/${copiedFile}`;
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
  mdast: GenericParent,
): Promise<string[]> {
  const linkNodes = (selectAll('link,linkBlock,card', mdast) as GenericNode[]).filter(
    (link) => !(link.internal || link.static),
  );
  if (linkNodes.length === 0) return [];
  const toc = tic();
  session.log.info(`🔗 Checking ${plural('%s link(s)', linkNodes)} in ${file}`);
  const linkResults = await Promise.all(
    linkNodes.map(async (link) =>
      limitOutgoingConnections(async () => {
        const { position, url } = link;
        if (!url) {
          addWarningForFile(
            session,
            file,
            `Linkable node (${link.type}) is missing a URL`,
            'error',
            {
              position,
              ruleId: RuleId.linkResolves,
            },
          );
          return '';
        }
        const check = await checkLink(session, url);
        if (check.ok || check.skipped) return url as string;
        const status = check.status ? ` (${check.status}, ${check.statusText})` : '';
        addWarningForFile(session, file, `Link for "${url}" did not resolve.${status}`, 'error', {
          position,
          ruleId: RuleId.linkResolves,
          key: url,
        });
        return url as string;
      }),
    ),
  );
  session.log.info(toc(`🔗 Checked ${plural('%s link(s)', linkNodes)} in ${file} in %s`));
  return linkResults;
}
