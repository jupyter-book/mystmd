import { fileWarn, fileError } from 'myst-common';
import type { VFile } from 'vfile';
import type { Inventory } from 'intersphinx';
import type { Link, LinkTransformer } from './types';
import { updateLinkTextIfEmpty } from './utils';

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
    if (!url.hash) {
      fileError(file, `Must provide a target for "${urlSource}"`, {
        node: link,
        note: 'Use the `#` symbol to create a target, for example, <myst:project#my-target>',
        source: TRANSFORM_SOURCE,
      });
      return false;
    }
    const target = url.hash.replace(/^#/, '');
    const lookup = this.intersphinx.find((i) => {
      if (url.pathname) return i.id === url.pathname;
      // If the pathname is not specified, check if it has the target
      return !!i.getEntry({ name: target });
    });
    if (!lookup) {
      fileWarn(file, `Unknown project "${url.pathname}" for link: ${urlSource}`, {
        node: link,
        source: TRANSFORM_SOURCE,
      });
      return false;
    }
    // TODO: add query params in here to pick the domain
    const entry = lookup.getEntry({ name: target });
    if (!entry) {
      fileWarn(file, `"${urlSource}" not found interspinx ${lookup.id} (${lookup.path})`, {
        node: link,
        source: TRANSFORM_SOURCE,
      });
      return false;
    }
    link.internal = false;
    link.url = entry.location;
    updateLinkTextIfEmpty(link, entry.display || lookup.id || '(see documentation)');
    return true;
  }
}
