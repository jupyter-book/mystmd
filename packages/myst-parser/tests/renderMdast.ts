import type { Root } from 'mdast';
import { State, transform, mystToHast, formatHtml } from 'myst-to-html';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';

export function renderMdast(
  tree: Root,
  opts: {
    formatHtml: boolean;
    hast: {
      clobberPrefix: 'm-';
      allowDangerousHtml: boolean;
    };
    stringifyHtml: {
      closeSelfClosing: boolean;
      allowDangerousHtml: boolean;
    };
  },
) {
  const state = new State();
  const pipe = unified()
    .use(transform, state)
    .use(mystToHast, opts.hast)
    .use(formatHtml, opts.formatHtml)
    .use(rehypeStringify, opts.stringifyHtml);
  const result = pipe.runSync(tree);
  const html = pipe.stringify(result);
  return html.trim();
}
