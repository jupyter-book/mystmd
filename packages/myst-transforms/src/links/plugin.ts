import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { Link, LinkTransformer } from './types';

type Options = {
  transformers: LinkTransformer[];
  selector?: string;
};

export function linksTransform(mdast: Root, file: VFile, opts: Options): void {
  const linkNodes = selectAll(opts.selector ?? 'link,card', mdast) as Link[];
  linkNodes.forEach((link) => {
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

export const linksPlugin: Plugin<[Options], Root, Root> = (opts) => (tree, file) => {
  linksTransform(tree, file, opts);
};
