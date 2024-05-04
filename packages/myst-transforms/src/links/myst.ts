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
    const normalized = uri.replace(/^myst/, 'xref');
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
  protocol = 'xref:myst';

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
    return !!this.mystXRefsList.find((m) => m.key && normalizedUri.startsWith(`xref:${m.key}`));
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
    // Link format looks like <xref:key/page#identifier>
    // This key to matches frontmatter.references key
    const key = url.pathname.split('/')[0];
    // Page includes leading slash
    const page = url.pathname.slice(key.length);
    const identifier = url.hash?.replace(/^#/, '');
    const mystXRefs = this.mystXRefsList.find((m) => m.key === key);
    if (!mystXRefs || !mystXRefs.value) {
      fileError(file, `Unknown project "${key}" for link: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.mystLinkValid,
      });
      return false;
    }
    let match: MystXRef | undefined;
    if (identifier) {
      match = mystXRefs.value.references.find((ref) => {
        // If page is explicitly provided, it must match url
        if (page && ref.url !== page) return false;
        // If page is not provided, implicit links are ignored
        if (!page && ref.implicit) return false;
        return ref.identifier === identifier || ref.html_id === identifier;
      });
    } else {
      // If no identifier, only match page urls. No page matches root path
      match = mystXRefs.value.references.find((ref) => {
        if (ref.kind !== 'page') return false;
        if (!page && ref.url === '/') return true;
        return ref.url === page;
      });
    }
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
    link.url = `${mystXRefs.url}${match.url}`;
    link.dataUrl = `${mystXRefs.url}${match.data}`;
    if (match.kind !== 'page') {
      // Upgrade links to cross-references with identifiers
      (link as any).type = 'crossReference';
      (link as any).remote = true;
      (link as any).identifier = match.identifier;
      (link as any).label = match.identifier;
      (link as any).html_id = match.html_id;
    }
    return true;
  }
}
