import { fileWarn, fileError, RuleId } from 'myst-common';
import type { VFile } from 'vfile';
import type { Inventory } from 'intersphinx';
import type { Link, LinkTransformer, ResolvedExternalReference } from './types.js';
import { updateLinkTextIfEmpty } from './utils.js';

const TRANSFORM_SOURCE = 'LinkTransform:SphinxTransformer';

function removeMystPrefix(uri: string, link?: Link, vfile?: VFile) {
  if (uri.startsWith('myst:')) {
    let normalized = uri.slice(5);
    if (normalized.includes('#') && !normalized.includes(':')) {
      normalized = normalized.replace('#', ':#');
    }
    if (vfile) {
      fileWarn(vfile, `"myst:" prefix is deprecated for external reference "${uri}"`, {
        note: `Use "${normalized}" instead.`,
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.mystLinkValid,
      });
    }
    return normalized;
  }
  return uri;
}

export class SphinxTransformer implements LinkTransformer {
  protocol = 'sphinx';

  intersphinx: Inventory[];

  constructor(references: ResolvedExternalReference[]) {
    this.intersphinx = references
      .filter((ref): ref is ResolvedExternalReference & { value?: Inventory } => {
        return ref.kind === 'intersphinx';
      })
      .filter((ref): ref is ResolvedExternalReference & { value: Inventory } => {
        return !!ref.value?._loaded;
      })
      .map((ref) => ref.value);
  }

  test(uri?: string): boolean {
    if (!uri) return false;
    const normalizedUri = removeMystPrefix(uri);
    return !!this.intersphinx.find((i) => i.id && normalizedUri.startsWith(`${i.id}:`));
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = removeMystPrefix(link.urlSource || link.url, link, file);
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
    const target = url.hash?.replace(/^#/, '') ?? '';
    const project = this.intersphinx.find((i) => i.id === url.protocol);
    if (!project || !project.path) {
      fileWarn(file, `Unknown project "${url.protocol}" for link: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.mystLinkValid,
      });
      return false;
    }
    if (!url.hash) {
      link.internal = false;
      link.url = project.path;
      updateLinkTextIfEmpty(link, project.id || '(see documentation)');
      return false;
    }
    // TODO: add query params in here to pick the domain
    const entry = project.getEntry({ name: target });
    if (!entry) {
      fileWarn(file, `"${urlSource}" not found in intersphinx ${project.id} (${project.path})`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.mystLinkValid,
      });
      return false;
    }
    link.internal = false;
    link.url = entry.location;
    updateLinkTextIfEmpty(link, entry.display || project.id || '(see documentation)');
    return true;
  }
}
