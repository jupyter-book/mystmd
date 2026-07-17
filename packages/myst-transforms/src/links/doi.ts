import { RuleId, fileError } from 'myst-common';
import { doi } from 'doi-utils';
import type { VFile } from 'vfile';
import type { Link } from 'myst-spec-ext';
import type { LinkTransformer } from './types.js';
import { updateLinkTextIfEmpty } from './utils.js';

const TRANSFORM_SOURCE = 'LinkTransform:DOITransformer';

/** Canonical doi.org resolver hosts (exact hostname match). */
const DOI_ORG_HOSTNAMES = new Set(['doi.org', 'www.doi.org', 'dx.doi.org']);

function isDoiOrgHostname(hostname: string): boolean {
  return DOI_ORG_HOSTNAMES.has(hostname.toLowerCase());
}

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
      if (url.hostname && !isDoiOrgHostname(url.hostname)) return false;
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
