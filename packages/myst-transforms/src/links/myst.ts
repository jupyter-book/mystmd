import { fileWarn, fileError, RuleId } from 'myst-common';
import type { VFile } from 'vfile';
import type {
  Link,
  LinkTransformer,
  MystXref,
  MystXrefs,
  ResolvedExternalReference,
} from './types.js';

const TRANSFORM_SOURCE = 'LinkTransform:MystTransformer';

export function removeMystPrefix(uri: string, vfile?: VFile, link?: Link, source?: string) {
  if (uri.startsWith('myst:')) {
    let normalized = uri.slice(5);
    if (normalized.includes('#') && !normalized.includes(':')) {
      normalized = normalized.replace('#', ':#');
    }
    if (vfile) {
      fileWarn(vfile, `"myst:" prefix is deprecated for external reference "${uri}"`, {
        note: `Use "${normalized}" instead.`,
        node: link,
        source,
        ruleId: RuleId.mystLinkValid,
      });
    }
    return normalized;
  }
  return uri;
}

export class MystTransformer implements LinkTransformer {
  protocol = 'myst';

  mystXrefsList: { key: string; url: string; value: MystXrefs }[];

  constructor(references: ResolvedExternalReference[]) {
    this.mystXrefsList = references
      .filter((ref): ref is ResolvedExternalReference & { value?: MystXrefs } => {
        return ref.kind === 'myst';
      })
      .filter((ref): ref is ResolvedExternalReference & { value: MystXrefs } => {
        return !!ref.value;
      });
  }

  test(uri?: string): boolean {
    if (!uri) return false;
    const normalizedUri = removeMystPrefix(uri);
    return !!this.mystXrefsList.find((m) => m.key && normalizedUri.startsWith(`${m.key}:`));
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = removeMystPrefix(link.urlSource || link.url, file, link, TRANSFORM_SOURCE);
    let url: URL;
    try {
      url = new URL(urlSource);
    } catch (err) {
      fileError(file, `Could not parse url for "${urlSource}"`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.mystLinkValid,
      });
      return false;
    }
    const pathname = url.pathname.replace(/^\//, '');
    const hash = url.hash?.replace(/^#/, '');
    const protocol = url.protocol?.replace(/:$/, '');
    const mystXrefs = this.mystXrefsList.find((m) => m.key === protocol);
    if (!mystXrefs || !mystXrefs.value) {
      fileError(file, `Unknown project "${protocol}" for link: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.mystLinkValid,
      });
      return false;
    }
    let match: MystXref | undefined;
    if (pathname && hash) {
      // Path and identifier explicitly provided
      match = mystXrefs.value.references.find((ref) => {
        if (ref.url.replace(/^\//, '') !== pathname) return false;
        return ref.identifier === hash || ref.html_id === hash;
      });
    } else if (hash) {
      // Only identifier provided - do not match implicit references
      match = mystXrefs.value.references.find((ref) => {
        if (ref.implicit) return false;
        return ref.identifier === hash || ref.html_id === hash;
      });
    } else {
      // Nothing pathname is provided - only match pages
      // Note: pathname may be an empty string; this matches the root page
      match = mystXrefs.value.references.find((ref) => {
        return ref.kind === 'page' && ref.identifier === pathname;
      });
    }
    // handle case of pathname and no hash - just link to page
    if (!match) {
      fileError(
        file,
        `"${urlSource}" not found in MyST project ${mystXrefs.key} (${mystXrefs.url})`,
        {
          node: link,
          source: TRANSFORM_SOURCE,
          ruleId: RuleId.mystLinkValid,
        },
      );
      return false;
    }
    link.internal = false;
    link.url = `${mystXrefs.url}${match.url}`;
    link.dataUrl = `${mystXrefs.url}${match.data}`;
    if (hash) {
      // Upgrade links with hashes to cross-references
      (link as any).type = 'crossReference';
      (link as any).remote = true;
      (link as any).identifier = hash;
      (link as any).label = hash;
    }
    return true;
  }
}
