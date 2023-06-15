import { fileWarn, fileError } from 'myst-common';
import type { VFile } from 'vfile';
import type { Inventory } from 'intersphinx';
import type { Link, LinkTransformer } from './types.js';
import { updateLinkTextIfEmpty } from './utils.js';

const TRANSFORM_SOURCE = 'LinkTransform:MystTransformer';

export class MystTransformer implements LinkTransformer {
  protocol = 'myst';

  intersphinx: Inventory[];

  constructor(intersphinx: Inventory[]) {
    this.intersphinx = intersphinx;
  }

  test(uri?: string): boolean {
    return !!uri?.startsWith('myst:');
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    let url: URL;
    try {
      url = new URL(urlSource);
    } catch (err) {
      fileError(file, `Could not parse url for "${urlSource}"`, {
        node: link,
        source: TRANSFORM_SOURCE,
      });
      return false;
    }
    const target = url.hash?.replace(/^#/, '') ?? '';
    const project = this.intersphinx.find((i) => {
      if (url.pathname) return i.id === url.pathname;
      // If the pathname is not specified, check if it has the target
      if (target) return !!i.getEntry({ name: target });
      return false;
    });
    if (!project || !project.path) {
      fileWarn(file, `Unknown project "${url.pathname}" for link: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
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
      fileWarn(file, `"${urlSource}" not found intersphinx ${project.id} (${project.path})`, {
        node: link,
        source: TRANSFORM_SOURCE,
      });
      return false;
    }
    link.internal = false;
    link.url = entry.location;
    updateLinkTextIfEmpty(link, entry.display || project.id || '(see documentation)');
    return true;
  }
}
