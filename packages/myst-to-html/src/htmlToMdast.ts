import { unified } from 'unified';
import type { Options } from 'rehype-parse';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import type { Handle, State } from 'hast-util-to-mdast';
import type { Nodes as MdastNodes } from 'mdast';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import type { GenericNode } from 'myst-common';

export type HtmlToMdastOptions = {
  htmlHandlers?: { [x: string]: Handle };
  keepBreaks?: boolean;
  /** Wrap top-level phrasing content in paragraphs, as for a whole document (default: true) */
  document?: boolean;
};

/**
 * Create an mdast node for a hast node, copying its position.
 *
 * This mirrors the `h(node, type, props, children)` helper that
 * hast-util-to-mdast provided before v10.
 */
export function createMdastNode(
  state: State,
  node: any,
  type: string,
  attrs: Record<string, any> = {},
  children?: MdastNodes[] | string,
): GenericNode {
  const result: GenericNode = { type, ...attrs };
  if (typeof children === 'string') result.value = children;
  else if (children) result.children = children as GenericNode[];
  state.patch(node, result as any);
  return result;
}

function brKeep(state: State, node: any) {
  return createMdastNode(state, node, '_break');
}

/**
 * Bring hast-util-to-mdast@10 output in line with what earlier versions produced
 *
 * - Runs of phrasing content that hold only breaks are wrapped in paragraphs, and
 *   then emptied when the surrounding breaks are dropped; earlier versions omitted them.
 * - Breaks at the start or end of the fragment are kept; earlier versions dropped them.
 */
function normalizeBreaks(children: GenericNode[]): GenericNode[] {
  const root = { type: 'root', children };
  remove(
    root,
    { cascade: false },
    (n: GenericNode) => n.type === 'paragraph' && !n.children?.length,
  );
  let start = 0;
  let end = root.children.length;
  while (start < end && root.children[start].type === 'break') start++;
  while (end > start && root.children[end - 1].type === 'break') end--;
  return root.children.slice(start, end);
}

/**
 * Convert an HTML string to mdast nodes, without positions
 *
 * HTML nodes are often fragments in the middle of markdown text, so `keepBreaks`
 * (the default) converts `<br />` tags to `break` nodes as they are, rather than
 * applying hast-util-to-mdast's handling of breaks at the start and end of content.
 */
export function htmlToMdast(value: string, opts?: HtmlToMdastOptions): GenericNode[] {
  const hast = unified()
    .use(rehypeParse, { fragment: true } as Options)
    .parse(value);
  if (opts?.keepBreaks ?? true) {
    selectAll('[tagName=br]', hast).forEach((n: any) => {
      n.tagName = '_brKeep';
    });
  }
  const handlers: Record<string, Handle> = { _brKeep: brKeep as Handle, ...opts?.htmlHandlers };
  const mdast = unified()
    .use(rehypeRemark, { handlers, document: opts?.document ?? true })
    .runSync(hast);
  const children = normalizeBreaks(mdast.children as GenericNode[]);
  const root = { type: 'root', children };
  visit(root, (n: GenericNode) => {
    delete n.position;
    if (n.type === '_break') n.type = 'break';
  });
  return root.children;
}
