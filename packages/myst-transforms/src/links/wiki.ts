import { RuleId, fileError, fileWarn } from 'myst-common';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types.js';
import { updateLinkTextIfEmpty, withoutHttp } from './utils.js';

const DEFAULT_LANGUAGE = 'en';
const ANY_WIKIPEDIA_ORG = /^(?:https?:\/\/)?(?:([a-z]+)\.)?wikipedia\.org\/wiki\/(.+)$/;
const TRANSFORM_SOURCE = 'LinkTransform:WikiTransformer';

function removeWiki(url: string, replace = '') {
  return url.replace(/\/?(wiki\/?)?$/, replace).replace(/^\/?(wiki\/)/, '');
}

export class WikiTransformer implements LinkTransformer {
  protocol = 'wiki';

  wikiUrl: string;

  lang?: string;

  constructor(opts?: { url?: string; lang?: string }) {
    // Ensure for the link formatting that the URL ends in a "/"
    this.wikiUrl = removeWiki(
      opts?.url ?? `https://${opts?.lang || DEFAULT_LANGUAGE}.wikipedia.org/`,
      '/',
    );
    this.lang = opts?.lang || `${this.wikiUrl}wiki/x`.match(ANY_WIKIPEDIA_ORG)?.[1] || undefined;
  }

  test(uri?: string): boolean {
    if (!uri) return false;
    if (uri.startsWith('wiki:')) return true;
    if (uri.match(ANY_WIKIPEDIA_ORG)) return true;
    if (withoutHttp(uri).startsWith(withoutHttp(this.wikiUrl))) return true;
    return false;
  }

  pageName(uri: string): { page: string; wiki: string; lang?: string } | undefined {
    if (uri.startsWith('wiki:')) {
      return { page: uri.replace(/^wiki:/, '').trim(), wiki: this.wikiUrl, lang: this.lang };
    }
    if (withoutHttp(uri).startsWith(withoutHttp(this.wikiUrl))) {
      const page = removeWiki(withoutHttp(uri).replace(withoutHttp(this.wikiUrl), ''));
      return { page, wiki: this.wikiUrl, lang: this.lang };
    }
    const match = uri.match(ANY_WIKIPEDIA_ORG);
    if (!match) return undefined;
    const [, lang, page] = match;
    return { page, wiki: `https://${lang || DEFAULT_LANGUAGE}.wikipedia.org/`, lang };
  }

  transform(link: Link, file: VFile): boolean {
    const urlSource = link.urlSource || link.url;
    const result = this.pageName(urlSource);
    if (!result) {
      fileWarn(file, `Wikipedia pagenames should not contain spaces in link: ${urlSource}`, {
        node: link,
        note: 'Replace spaces with underscores',
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.wikipediaLinkValid,
      });
      return false;
    }
    let { page } = result;
    if (page.match(/\s/)) {
      fileWarn(file, `Wikipedia pagenames should not contain spaces in link: ${urlSource}`, {
        node: link,
        note: 'Replace spaces with underscores',
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.wikipediaLinkValid,
      });
    }
    if (page.match(/\//)) {
      fileError(file, `Wikipedia pagenames should not contain "/" in link: ${urlSource}`, {
        node: link,
        note: 'Only point to the final page name, do not include any other parts of the Wikipedia URL.',
        source: TRANSFORM_SOURCE,
        ruleId: RuleId.wikipediaLinkValid,
      });
      return false;
    }
    // Replace any repeated spaces with underscores, and trim leading/trailing underscroes
    page = page
      .replace(/[\s]+/g, '_')
      .replace(/_[_]+/, '_')
      .replace(/(?:^_)|(?:_$)/g, '');
    link.url = `${result.wiki}wiki/${page}`;
    link.data = {
      page: page,
      wiki: result.wiki,
      lang: result.lang,
    };
    link.internal = false;
    const title = page.replace(/_/g, ' ');
    updateLinkTextIfEmpty(link, title);
    return true;
  }
}
