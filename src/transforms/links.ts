import { GenericNode, selectAll } from 'mystjs';
import { oxaLink, oxaLinkToId } from '@curvenote/blocks';
import { ISession } from '../session/types';
import { selectors } from '../store';
import { Root } from '../myst';

type LinkInfo = {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
};

export type LinkLookup = Record<string, LinkInfo>;

export function transformLinks(session: ISession, mdast: Root): boolean {
  const links = selectAll('link,linkBlock', mdast) as GenericNode[];
  if (links.length === 0) return false;
  let changed = 0;
  links.forEach((link) => {
    const oxa = link.oxa || oxaLinkToId(link.url);
    if (!oxa) return;
    link.oxa = oxa;
    const key = oxaLink(oxa, false) as string;
    const info = selectors.selectOxaLinkInformation(session.store.getState(), key);
    const url = info?.url;
    if (url && url !== link.url) {
      changed += 1;
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
  });
  return changed > 0;
}
