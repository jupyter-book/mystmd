import { fileWarn, fileError, RuleId } from 'myst-common';
import type { VFile } from 'vfile';
import type {
  Link,
  LinkTransformer,
  MystXRef,
  MystXRefs,
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

  mystXRefsList: { key: string; url: string; value: MystXRefs }[];

  constructor(references: ResolvedExternalReference[]) {
    this.mystXRefsList = references
      .filter((ref): ref is ResolvedExternalReference & { value?: MystXRefs } => {
        return ref.kind === 'myst';
      })
      .filter((ref): ref is ResolvedExternalReference & { value: MystXRefs } => {
        return !!ref.value;
      });
  }

  test(uri?: string): boolean {
    if (!uri) return false;
    const normalizedUri = removeMystPrefix(uri);
    return !!this.mystXRefsList.find((m) => m.key && normalizedUri.startsWith(`${m.key}:`));
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
    const mystXRefs = this.mystXRefsList.find((m) => m.key === protocol);
    if (!mystXRefs || !mystXRefs.value) {
      fileError(file, `Unknown project "${protocol}" for link: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.mystLinkValid,
      });
      return false;
    }
    let match: MystXRef | undefined;
    if (pathname && hash) {
      // Path and identifier explicitly provided
      match = mystXRefs.value.references.find((ref) => {
        if (ref.url.replace(/^\//, '') !== pathname) return false;
        return ref.identifier === hash || ref.html_id === hash;
      });
    } else if (hash) {
      // Only identifier provided - do not match implicit references
      match = mystXRefs.value.references.find((ref) => {
        if (ref.implicit) return false;
        return ref.identifier === hash || ref.html_id === hash;
      });
    } else if (pathname) {
      // Only path provided - only match pages
      match = mystXRefs.value.references.find((ref) => {
        if (ref.kind !== 'page') return false;
        return ref.url.replace(/^\//, '') === pathname || ref.identifier === pathname;
      });
    }
    // handle case of pathname and no hash - just link to page
    if (!match) {
      fileError(
        file,
        `"${urlSource}" not found in MyST project ${mystXRefs.key} (${mystXRefs.url})`,
        {
          node: link,
          source: TRANSFORM_SOURCE,
          ruleId: RuleId.mystLinkValid,
        },
      );
      return false;
    }
    link.internal = false;
    link.url = `${mystXRefs.url}${match.url}${match.html_id ? '#' : ''}${match.html_id ?? ''}`;
    link.dataUrl = `${mystXRefs.url}${match.data}`;
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
