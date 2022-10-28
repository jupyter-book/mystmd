import { fileWarn } from 'myst-common';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types';
import { updateLinkTextIfEmpty, withoutHttp } from './utils';

const RESOLVER = 'https://scicrunch.org/resolver/';
const TRANSFORM_SOURCE = 'LinkTransform:RRIDTransformer';

function isValid(rrid: string): boolean {
  // TODO: regexp validation
  return !!rrid;
}

function getRRID(uri: string) {
  if (uri.startsWith('rrid:')) {
    return uri.replace(/^rrid:/, '').trim();
  }
  if (withoutHttp(uri).startsWith(withoutHttp(RESOLVER))) {
    return withoutHttp(uri).replace(withoutHttp(RESOLVER), '').trim();
  }
  return uri.trim();
}

export class RRIDTransformer implements LinkTransformer {
  protocol = 'rrid';

  test(uri?: string): boolean {
    if (!uri) return false;
    if (uri.startsWith('rrid:')) return true;
    return withoutHttp(uri).startsWith(withoutHttp(RESOLVER));
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const rrid = getRRID(urlSource);
    if (!isValid(rrid)) {
      fileWarn(file, `RRID is not valid: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
      });
      return false;
    }
    link.url = `${RESOLVER}${rrid}`;
    link.data = { rrid };
    link.internal = false;
    updateLinkTextIfEmpty(link, rrid);
    return true;
  }
}
