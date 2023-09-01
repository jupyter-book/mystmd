import type { Plugin } from 'unified';
import type { H, Handle } from 'hast-util-to-mdast';
import type { Parent } from 'myst-spec';
import { unified } from 'unified';
import { all } from 'hast-util-to-mdast';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import type { Options } from 'rehype-parse';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import { liftChildren } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import { mystToHtml } from 'myst-to-html';
import { remove } from 'unist-util-remove';

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

function finalizeNode(htmlNodeWithChildren: GenericParent, htmlClosingNode: GenericNode) {
  const innerHtml = mystToHtml({ type: 'root', children: htmlNodeWithChildren.children });
  htmlNodeWithChildren.value = `${htmlNodeWithChildren.value?.trim()}${innerHtml}${htmlClosingNode.value?.trim()}`;
  htmlNodeWithChildren.children.forEach((child: GenericNode) => {
    child.type = '__delete__';
  });
  htmlClosingNode.type = '__delete__';
  delete (htmlNodeWithChildren as GenericNode).children;
}

function htmlFutz(tree: GenericParent) {
  const htmlOpenNodes: GenericParent[] = [];
  tree.children.forEach((child: GenericNode) => {
    if (child.type === 'html') {
      const value = child.value?.trim();
      if (value?.startsWith('</')) {
        // Closing node
        const htmlOpenNode = htmlOpenNodes.pop();
        if (!htmlOpenNode) {
          return;
        }
        finalizeNode(htmlOpenNode, child);
        if (htmlOpenNodes.length) {
          htmlOpenNodes[htmlOpenNodes.length - 1].children.push(htmlOpenNode);
        }
      } else if (!value?.endsWith('/>') && !value?.endsWith('-->')) {
        // Opening node that doesn't close itself
        child.children = [];
        htmlOpenNodes.push(child as GenericParent);
      }
    } else {
      if (child.children) {
        htmlFutz(child as GenericParent);
      }
      if (htmlOpenNodes.length) {
        htmlOpenNodes[htmlOpenNodes.length - 1].children.push(child);
      }
    }
  });
  // At this point, any htmlOpenNodes are errors; just clean them up.
  htmlOpenNodes.forEach((node: GenericNode) => {
    delete node.children;
  });
}

export function reviveHtmlTransform(tree: GenericParent) {
  htmlFutz(tree);
  remove(tree, '__delete__');
  return tree;
}

export const htmlPlugin: Plugin<[HtmlTransformOptions?], GenericParent, GenericParent> =
  (opts) => (tree) => {
    htmlTransform(tree, opts);
  };
