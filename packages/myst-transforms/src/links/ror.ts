import { RuleId, fileWarn } from 'myst-common';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types.js';
import { updateLinkTextIfEmpty, withoutHttp } from './utils.js';

const RESOLVER = 'https://ror.org/';
const TRANSFORM_SOURCE = 'LinkTransform:RORTransformer';

function isValid(rrid: string): boolean {
  // TODO: regexp validation
  return !!rrid;
}

function getROR(uri: string) {
  if (uri.startsWith('ror:')) {
    return uri.replace(/^ror:/, '').trim();
  }
  if (withoutHttp(uri).startsWith(withoutHttp(RESOLVER))) {
    return withoutHttp(uri).replace(withoutHttp(RESOLVER), '').trim();
  }
  return uri.trim();
}

export class RORTransformer implements LinkTransformer {
  protocol = 'ror';

  test(uri?: string): boolean {
    if (!uri) return false;
    if (uri.startsWith('ror:')) return true;
    return withoutHttp(uri).startsWith(withoutHttp(RESOLVER));
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const ror = getROR(urlSource);
    if (!isValid(ror)) {
      fileWarn(file, `ROR is not valid: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.rorLinkValid,
      });
      return false;
    }
    link.url = `${RESOLVER}${ror}`;
    link.data = { ...link.data, ror };
    link.internal = false;
    updateLinkTextIfEmpty(link, ror);
    return true;
  }
}
