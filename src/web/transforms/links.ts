import { oxaLink, oxaLinkToId } from '@curvenote/blocks';
import { GenericNode, selectAll } from 'mystjs';
import { Root } from './types';

export type LinkLookup = Record<string, string>;

export function transformLinks(mdast: Root, lookup: LinkLookup): boolean {
  const links = selectAll('link', mdast) as GenericNode[];
  if (links.length === 0) return false;
  let changed = 0;
  links.forEach((link) => {
    const oxa = link.oxa || oxaLinkToId(link.url);
    if (!oxa) return;
    link.oxa = oxa;
    const key = oxaLink(oxa, false) as string;
    const url = lookup[key];
    if (url && url !== link.url) {
      changed += 1;
      // the `internal` flag is picked up in the link renderer (prefetch!)
      link.internal = true;
      link.url = url;
    }
  });
  return changed > 0;
}
