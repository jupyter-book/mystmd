import { fileError, fileWarn } from 'myst-utils';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types';
import { updateLinkTextIfEmpty, withoutHttp } from './utils';

const ENGLISH_WIKIPEDIA = 'https://en.wikipedia.org/';
const TRANSFORM_SOURCE = 'LinkTransform:WikiTransformer';

function removeTrailingWiki(url: string, replace = '') {
  return url.replace(/\/?(wiki\/?)?$/, replace);
}

export class WikiTransformer implements LinkTransformer {
  protocol = 'wiki';

  wikiUrl: string;

  constructor(opts?: { url: string }) {
    // Ensure for the link formatting that the URL ends in a "/"
    this.wikiUrl = removeTrailingWiki(opts?.url ?? ENGLISH_WIKIPEDIA, '/');
  }

  test(uri?: string): boolean {
    if (!uri) return false;
    if (uri.startsWith('wiki:')) return true;
    return withoutHttp(uri).startsWith(withoutHttp(this.wikiUrl));
  }

  pageName(uri: string) {
    if (uri.startsWith('wiki:')) {
      return uri.replace(/^wiki:/, '').trim();
    }
    if (withoutHttp(uri).startsWith(withoutHttp(this.wikiUrl))) {
      return removeTrailingWiki(withoutHttp(uri).replace(withoutHttp(this.wikiUrl), '').trim());
    }
    return uri.trim();
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    let pageName = this.pageName(urlSource);
    if (pageName.match(/\s/)) {
      fileWarn(file, `Wikipedia pagenames should not contain spaces in link: ${urlSource}`, {
        node: link,
        note: 'Replace spaces with underscores',
        source: TRANSFORM_SOURCE,
      });
    }
    if (pageName.match(/\//)) {
      fileError(file, `Wikipedia pagenames should not contain "/" in link: ${urlSource}`, {
        node: link,
        note: 'Only point to the final page name, do not include any other parts of the Wikipedia URL.',
        source: TRANSFORM_SOURCE,
      });
      return false;
    }
    // Replace any repeated spaces with underscores, and trim leading/trailing underscroes
    pageName = pageName
      .replace(/[\s]+/g, '_')
      .replace(/_[_]+/, '_')
      .replace(/(?:^_)|(?:_$)/g, '');
    link.url = `${this.wikiUrl}wiki/${pageName}`;
    link.data = {
      page: pageName,
      wiki: this.wikiUrl,
    };
    link.internal = false;
    const title = pageName.replace(/_/, ' ');
    updateLinkTextIfEmpty(link, title);
    return true;
  }
}
