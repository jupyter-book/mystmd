import { RuleId, fileError } from 'myst-common';
import { doi } from 'doi-utils';
import type { VFile } from 'vfile';
import type { Link } from 'myst-spec-ext';
import type { LinkTransformer } from './types.js';
import { updateLinkTextIfEmpty } from './utils.js';

const TRANSFORM_SOURCE = 'LinkTransform:DOITransformer';

/** Matches doi.org, dx.doi.org, and www.doi.org — same hosts as doi-utils doiOrg resolver. */
const DOI_ORG_HOSTNAME = /(?:dx\.)?(?:www\.)?doi\.org/i;

export type DoiOptions = {
  /** When true, infer DOIs from non-doi.org URLs (publisher pages, biorxiv, zenodo, etc.). */
  inferDoisFromUrls?: boolean;
};

/**
 * Decide whether a string should be treated as a DOI link or citation label.
 *
 * Unless `inferDoisFromUrls` is enabled, URLs with a non-doi.org hostname are rejected.
 * Otherwise, delegates to doi-utils validation.
 */
export function isRecognizedDoi(uri?: string, opts?: DoiOptions): boolean {
  if (!uri) return false;
  if (!opts?.inferDoisFromUrls) {
    try {
      const url = new URL(uri);
      if (url.hostname && !DOI_ORG_HOSTNAME.test(url.hostname)) return false;
    } catch {
      // Not a URL — fall through to doi-utils validation.
    }
  }
  return doi.validate(uri);
}

export class DOITransformer implements LinkTransformer {
  protocol = 'doi';

  constructor(private doiOpts?: DoiOptions) {}

  test(uri?: string): boolean {
    if (uri?.startsWith('doi:')) {
      // May not be valid, but flag for transform to report errors.
      return true;
    }
    return isRecognizedDoi(uri, this.doiOpts);
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const doiUrl = doi.buildUrl(urlSource);
    if (!doiUrl) {
      fileError(file, `DOI is not valid: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.doiLinkValid,
        key: urlSource,
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
