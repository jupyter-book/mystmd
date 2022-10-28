import { fileError } from 'myst-common';
import { validate, normalize } from 'doi-utils';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types';
import { updateLinkTextIfEmpty } from './utils';

const DOI_ORG = 'https://doi.org/';
const TRANSFORM_SOURCE = 'LinkTransform:DOITransformer';

export class DOITransformer implements LinkTransformer {
  protocol = 'doi';

  test(uri?: string): boolean {
    if (uri?.startsWith('doi:')) {
      // This may not be valid but flag it for the transform
      return true;
    }
    if (uri && validate(normalize(uri))) return true;
    return false;
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const doi = normalize(urlSource);
    if (!doi || !validate(doi)) {
      fileError(file, `DOI is not valid: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
      });
      return false;
    }
    link.url = `${DOI_ORG}${doi}`;
    link.data = { doi };
    link.internal = false;
    updateLinkTextIfEmpty(link, '');
    return true;
  }
}
