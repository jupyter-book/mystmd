import { RuleId, fileError } from 'myst-common';
import { doi } from 'doi-utils';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types.js';
import { updateLinkTextIfEmpty } from './utils.js';

const TRANSFORM_SOURCE = 'LinkTransform:DOITransformer';

export class DOITransformer implements LinkTransformer {
  protocol = 'doi';

  test(uri?: string): boolean {
    if (uri?.startsWith('doi:')) {
      // This may not be valid but flag it for the transform
      return true;
    }
    if (uri && doi.validate(uri)) return true;
    return false;
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const doiUrl = doi.buildUrl(urlSource);
    if (!doiUrl) {
      fileError(file, `DOI is not valid: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.doiLinkValid,
      });
      return false;
    }
    link.url = doiUrl;
    link.data = { ...link.data, doi: doi.normalize(doiUrl) };
    link.internal = false;
    updateLinkTextIfEmpty(link, '');
    return true;
  }
}
