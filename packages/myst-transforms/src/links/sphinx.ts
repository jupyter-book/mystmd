import { fileError, RuleId } from 'myst-common';
import type { Link } from 'myst-spec-ext';
import type { VFile } from 'vfile';
import type { Inventory } from 'intersphinx';
import type { LinkTransformer, ResolvedExternalReference } from './types.js';
import { updateLinkTextIfEmpty } from './utils.js';
import { removeMystPrefix } from './myst.js';

const TRANSFORM_SOURCE = 'LinkTransform:SphinxTransformer';

export class SphinxTransformer implements LinkTransformer {
  protocol = 'xref:sphinx';

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
    return !!this.intersphinx.find((i) => i.id && normalizedUri.startsWith(`xref:${i.id}`));
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
        ruleId: RuleId.sphinxLinkValid,
      });
      return false;
    }
    // Link format looks like <xref:id#target>
    // This key to matches frontmatter.references key
    const id = url.pathname;
    // Page includes leading slash
    const target = url.hash?.replace(/^#/, '') ?? '';
    const project = this.intersphinx.find((i) => i.id === id);
    if (!project || !project.path) {
      fileError(file, `Unknown project "${id}" for link: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.sphinxLinkValid,
      });
      return false;
    }
    if (!target) {
      link.internal = false;
      link.url = project.path;
      updateLinkTextIfEmpty(link, project.id || '(see documentation)');
      return true;
    }
    // TODO: add query params in here to pick the domain
    const entry = project.getEntry({ name: target });
    if (!entry) {
      fileError(file, `"${urlSource}" not found in intersphinx ${project.id} (${project.path})`, {
        node: link,
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.sphinxLinkValid,
      });
      return false;
    }
    link.internal = false;
    link.url = entry.location;
    updateLinkTextIfEmpty(link, entry.display || project.id || '(see documentation)');
    return true;
  }
}
