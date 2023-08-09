import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';
import { formatHtml } from './format.js';
import { mystToHast } from './schema.js';
import { State } from './state.js';
import { transform } from './transforms.js';
import type { GenericParent } from 'myst-common';

export function mystToHtml(
  tree: GenericParent,
  opts?: {
    formatHtml?: boolean;
    hast?: {
      clobberPrefix?: 'm-';
      allowDangerousHtml?: boolean;
    };
    stringifyHtml?: {
      closeSelfClosing?: boolean;
      allowDangerousHtml?: boolean;
    };
  },
) {
  const state = new State();
  const pipe = unified()
    .use(transform, state)
    .use(mystToHast, opts?.hast)
    .use(formatHtml, opts?.formatHtml)
    .use(rehypeStringify, opts?.stringifyHtml);
  const result = pipe.runSync(tree);
  const html = pipe.stringify(result);
  return html.trim();
}
