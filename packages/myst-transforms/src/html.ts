import type { Plugin } from 'unified';
import type { H, Handle } from 'hast-util-to-mdast';
import type { Root } from 'mdast';
import type { Parent } from 'myst-spec';
import { unified } from 'unified';
import { all } from 'hast-util-to-mdast';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import type { Options } from 'rehype-parse';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import { liftChildren } from './utils';

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
  },
};

export function htmlTransform(tree: Root, opts?: HtmlTransformOptions) {
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

export const htmlPlugin: Plugin<[HtmlTransformOptions?], Root, Root> = (opts) => (tree) => {
  htmlTransform(tree, opts);
};
