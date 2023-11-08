import { RuleId, fileError } from 'myst-common';
import { doi } from 'doi-utils';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types.js';
import { updateLinkTextIfEmpty } from './utils.js';

const DOI_ORG = 'https://doi.org/';
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
    const doiString = doi.normalize(urlSource);
    if (!doiString) {
      fileError(file, `DOI is not valid: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.doiLinkValid,
      });
      return false;
    }
    link.url = `${DOI_ORG}${doiString}`;
    link.data = { doi: doiString };
    link.internal = false;
    updateLinkTextIfEmpty(link, '');
    return true;
  }
}
