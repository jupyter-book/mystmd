import fs from 'fs';
import path from 'path';
import { GenericNode, selectAll } from 'mystjs';
import { OxaLink, oxaLink, oxaLinkToId } from '@curvenote/blocks';
import { ISession } from '../session/types';
import { selectors } from '../store';
import { Root } from '../myst';
import { hashAndCopyStaticFile } from '../utils';

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
function mutateOxaLink(session: ISession, link: GenericNode, oxa: OxaLink) {
  link.oxa = oxa;
  const key = oxaLink(oxa, false) as string;
  const info = selectors.selectOxaLinkInformation(session.store.getState(), key);
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

/**
 * Replace relative file link with resolved site path
 */
function mutateRelativeLink(link: GenericNode, sitePath: string, target?: string[]) {
  link.sourceUrl = link.url;
  link.url = [sitePath, ...(target || [])].join('#');
  link.internal = true;
}

/**
 * Copy relative file to static folder and replace with absolute link
 */
function mutateStaticLink(session: ISession, link: GenericNode, linkFile: string) {
  const file = hashAndCopyStaticFile(session, linkFile);
  link.sourceUrl = link.url;
  link.url = `/_static/${file}`;
  link.static = true;
}

export function transformLinks(session: ISession, mdast: Root, file: string) {
  const links = selectAll('link,linkBlock', mdast) as GenericNode[];
  links.forEach((link) => {
    const oxa = link.oxa || oxaLinkToId(link.url);
    if (oxa) {
      mutateOxaLink(session, link, oxa);
      return;
    }
    const linkFileWithTarget = fileFromRelativePath(link.sourceUrl || link.url, file);
    if (linkFileWithTarget) {
      const [linkFile, ...target] = linkFileWithTarget.split('#');
      const { url } = selectors.selectFileInfo(session.store.getState(), linkFile) || {};
      if (url) {
        mutateRelativeLink(link, url, target);
      } else {
        mutateStaticLink(session, link, linkFile);
      }
    }
  });
}
