import { unified } from 'unified';
import type { Plugin } from 'unified';
import { liftChildren } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import type { Parent } from 'myst-spec';
import { mystToHtml } from 'myst-to-html';
import type { Element } from 'rehype-format';
import { fromHtml } from 'hast-util-from-html';
import { all } from 'hast-util-to-mdast';
import type { H, Handle } from 'hast-util-to-mdast';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import type { Options } from 'rehype-parse';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';

export type HtmlTransformOptions = {
  keepBreaks?: boolean;
  htmlHandlers?: { [x: string]: Handle };
};

const defaultHtmlToMdastOptions: Record<keyof HtmlTransformOptions, any> = {
  keepBreaks: true,
  htmlHandlers: {
    table(h: H, node: any) {
      return h(node, 'table', all(h, node));
    },
    th(h: H, node: any) {
      const result = h(node, 'tableCell', all(h, node));
      (result as any).header = true;
      return result;
    },
    _brKeep(h: H, node: any) {
      return h(node, '_break');
    },
    comment(h: any, node: any) {
      // Prevents HTML comments from showing up as text in web
      const result = h(node, 'comment');
      (result as any).value = node.value;
      return result;
    },
  },
};

export function htmlTransform(tree: GenericParent, opts?: HtmlTransformOptions) {
  const handlers = { ...defaultHtmlToMdastOptions.htmlHandlers, ...opts?.htmlHandlers };
  const otherOptions = { ...defaultHtmlToMdastOptions, ...opts };
  const htmlNodes = selectAll('html', tree) as Parent[];
  htmlNodes.forEach((node) => {
    const hast = unified()
      .use(rehypeParse, { fragment: true } as Options)
      .parse((node as any).value);
    // hast-util-to-mdast removes breaks if they are the first/last children
    // and nests standalone breaks in paragraphs.
    // However, since HTML nodes may just be fragments in the middle of markdown text,
    // there is an option to `keepBreaks` which will simply convert `<br />`
    // tags to `break` nodes, without the special hast-util-to-mdast behavior.
    if (otherOptions.keepBreaks) {
      selectAll('[tagName=br]', hast).forEach((n: any) => {
        n.tagName = '_brKeep';
      });
    }
    const mdast = unified().use(rehypeRemark, { handlers }).runSync(hast);
    node.type = 'htmlParsed';
    node.children = mdast.children as Parent[];
    visit(node, (n: any) => delete n.position);
  });
  liftChildren(tree, 'htmlParsed');
  selectAll('_break', tree).forEach((node: any) => {
    node.type = 'break';
  });
  return tree;
}

/**
 * Convert html nodes and children to single html node
 *
 * This function takes the html nodes with opening and closing tags; all the mdast content
 * between these nodes is present as 'children' on the opening node. The mdast content is
 * then converted to html, wrapped by the opening and closing tag, and saved to a single html
 * node. All of the processed nodes are then marked for deletion.
 */
function finalizeNode(htmlOpenNodeWithChildren: GenericParent, htmlCloseNode: GenericNode) {
  const innerHtml = mystToHtml(
    { type: 'root', children: htmlOpenNodeWithChildren.children },
    {
      hast: {
        handlers: {
          html: (h, node) => {
            return fromHtml(node.value, { fragment: true }).children as Element[];
          },
        },
      },
    },
  );
  // This would be good to sanitize, but the best solution requires jsdom, increasing build size by 50%...
  htmlOpenNodeWithChildren.value = `${htmlOpenNodeWithChildren.value?.trim()}${innerHtml}${htmlCloseNode.value?.trim()}`;
  htmlOpenNodeWithChildren.children.forEach((child: GenericNode) => {
    child.type = '__delete__';
  });
  htmlCloseNode.type = '__delete__';
  delete (htmlOpenNodeWithChildren as GenericNode).children;
}

function reconstructHtml(tree: GenericParent) {
  const htmlOpenNodes: GenericParent[] = [];
  tree.children.forEach((child: GenericNode) => {
    if (child.type === 'html') {
      const value = child.value?.trim();
      if (value?.startsWith('</')) {
        // In this case, child is a standalone closing html node
        const htmlOpenNode = htmlOpenNodes.pop();
        if (!htmlOpenNode) {
          return;
        }
        finalizeNode(htmlOpenNode, child);
        if (htmlOpenNodes.length) {
          htmlOpenNodes[htmlOpenNodes.length - 1].children.push(htmlOpenNode);
        }
      } else if (!value?.endsWith('/>') && !value?.endsWith('-->')) {
        // In this case, child is a standalone opening html node
        child.children = [];
        htmlOpenNodes.push(child as GenericParent);
      }
    } else {
      if (child.children) {
        // Recursively process children
        reconstructHtml(child as GenericParent);
      }
      if (htmlOpenNodes.length) {
        // If we are between an opening and closing node, add this to the html content to be processed
        htmlOpenNodes[htmlOpenNodes.length - 1].children.push(child);
      }
    }
  });
  // At this point, any htmlOpenNodes are errors; just clean them up.
  htmlOpenNodes.forEach((node: GenericNode) => {
    delete node.children;
  });
}

/**
 * Traverse mdast tree to reconstruct html elements split across mdast nodes into a single node
 *
 * This function identifies html "opening" nodes, then collects the subsequent mdast nodes until
 * it encounters a "closing" node, when it consolidates all the nodes into a single html node.
 */
export function reconstructHtmlTransform(tree: GenericParent) {
  reconstructHtml(tree);
  remove(tree, '__delete__');
  return tree;
}

export const htmlPlugin: Plugin<[HtmlTransformOptions?], GenericParent, GenericParent> =
  (opts) => (tree) => {
    htmlTransform(tree, opts);
  };
