import { unified } from 'unified';
import type { Options } from 'rehype-parse';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import type { Handle, State } from 'hast-util-to-mdast';
import type { Nodes as MdastNodes } from 'mdast';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import type { GenericNode, GenericParent } from 'myst-common';

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
  childrenOrValue?: MdastNodes[] | string,
): GenericNode {
  const result: GenericNode = { type, ...attrs };
  if (typeof childrenOrValue === 'string') result.value = childrenOrValue;
  else if (childrenOrValue) result.children = childrenOrValue as GenericNode[];
  state.patch(node, result as any);
  return result;
}

function brKeep(state: State, node: any) {
  return createMdastNode(state, node, '_break');
}

/** Drop `break` nodes at the start and end of `nodes` */
function dropSurroundingBreaks(nodes: GenericNode[]): GenericNode[] {
  let start = 0;
  let end = nodes.length;
  while (start < end && nodes[start].type === 'break') start++;
  while (end > start && nodes[end - 1].type === 'break') end--;
  return nodes.slice(start, end);
}

/**
 * Bring hast-util-to-mdast@10 output closer to what earlier versions produced
 *
 * hast-util-to-mdast@8 dropped breaks at the start and end of the children of *every*
 * parent; version 10 only does so in paragraphs, including the ones it creates to wrap
 * runs of phrasing content. So:
 *
 * - Breaks at the start and end of the children of any node are dropped, as before.
 * - Empty paragraphs are removed; version 10 leaves them where a run of phrasing
 *   content held only breaks.
 *
 * This only affects `break` nodes, so breaks kept with `keepBreaks` (still `_break`
 * at this point) are left alone. One difference remains: breaks between block elements,
 * such as `<div>a</div><br /><div>b</div>`, used to be kept in a paragraph of their own,
 * and are now dropped.
 */
function normalizeBreaks(children: GenericNode[]): GenericNode[] {
  const root: GenericParent = { type: 'root', children };
  remove(
    root,
    { cascade: false },
    (n: GenericNode) => n.type === 'paragraph' && !n.children?.length,
  );
  visit(root, (n: GenericNode) => {
    if (n.children) n.children = dropSurroundingBreaks(n.children);
  });
  return root.children;
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
