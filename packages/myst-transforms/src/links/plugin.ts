import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types.js';
import type { GenericParent } from 'myst-common';

type Options = {
  transformers: LinkTransformer[];
  selector?: string;
};

/**
 * Formats long urls so that they break on smaller screens.
 * Uses a zero-width space, same as a `<wbr>` but no fancy rendering required.
 * https://css-tricks.com/better-line-breaks-for-long-urls/
 */
function formatLinkText(link: Link) {
  if (link.children?.length !== 1 || link.children[0].type !== 'text') return;
  const url = link.children[0].value;
  // Add an exception for wiki transforms links.
  if (url.length < 20 || url.match(/\s/) || url.startsWith('wiki:')) return;
  // Split the URL into an array to distinguish double slashes from single slashes
  const doubleSlash = url.split('//');
  // Format the strings on either side of double slashes separately
  const formatted = doubleSlash
    .map(
      (str) =>
        str
          // Before a single slash, tilde, period, comma, hyphen, underline, question mark, number sign, or percent symbol
          .replace(/([/~.,\-_?#%])/giu, '​$1')
          // Before and after an equals sign or ampersand
          .replace(/([=&])/giu, '​$1​'),
      // Reconnect the strings with word break opportunities after double slashes
    )
    .join('//​');
  link.children[0].value = formatted;
}

export function linksTransform(mdast: GenericParent, file: VFile, opts: Options): void {
  const linkNodes = selectAll(opts.selector ?? 'link,card', mdast) as Link[];
  linkNodes.forEach((link) => {
    formatLinkText(link);
    if (!link.urlSource) link.urlSource = link.url;
    const transform = opts.transformers.find((t) => t.test(link.urlSource));
    if (!transform) return;
    const result = transform.transform(link, file);
    if (result) {
      delete link.error;
      if (transform.protocol) {
        link.protocol = transform.protocol;
      }
    } else {
      link.error = true;
    }
  });
}

export const linksPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => (tree, file) => {
    linksTransform(tree, file, opts);
  };
