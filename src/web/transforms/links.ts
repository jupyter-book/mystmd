import { oxaLink, oxaLinkToId } from '@curvenote/blocks';
import { GenericNode, selectAll } from 'mystjs';
import { Root } from './types';

type LinkInfo = {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
};

export type LinkLookup = Record<string, LinkInfo>;

export function transformLinks(mdast: Root, lookup: LinkLookup): boolean {
  const links = selectAll('link,linkBlock', mdast) as GenericNode[];
  if (links.length === 0) return false;
  let changed = 0;
  links.forEach((link) => {
    const oxa = link.oxa || oxaLinkToId(link.url);
    if (!oxa) return;
    link.oxa = oxa;
    const key = oxaLink(oxa, false) as string;
    const { url } = lookup[key];
    if (url && url !== link.url) {
      changed += 1;
      // the `internal` flag is picked up in the link renderer (prefetch!)
      link.internal = true;
      link.url = url;
      if (link.type === 'linkBlock') {
        // Any values already present on the block override link info
        link.title = link.title || lookup[key].title;
        link.children = link.children || [{ type: 'text', value: lookup[key].description }];
        link.thumbnail = link.thumbnail || lookup[key].thumbnail;
      }
    }
  });
  return changed > 0;
}
