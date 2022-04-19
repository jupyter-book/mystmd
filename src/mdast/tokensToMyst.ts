import { MarkdownParseState } from './fromMarkdown';
import type { Root } from 'mdast';
import { Spec, Token, Admonition, Container, AdmonitionKind } from './types';
import { visit } from 'unist-util-visit';
import { remove } from 'unist-util-remove';
import { u } from 'unist-builder';
import he from 'he';
import { GenericNode } from '.';
import {
  admonitionKindToTitle,
  normalizeLabel,
  setTextAsChild,
  withoutTrailingNewline,
} from './utils';
import { selectAll } from 'unist-util-select';
import { ensureCaptionIsParagraph, liftChildren } from './transforms';

export type Options = {
  handlers?: Record<string, Spec>;
  hoistSingleImagesOutofParagraphs?: boolean;
  nestBlocks?: boolean;
};

const NUMBERED_CLASS = /^numbered$/;
const ALIGN_CLASS = /(?:(?:align-)|^)(left|right|center)/;

function getClassName(token: Token, exclude?: RegExp[]): string | undefined {
  const allClasses = new Set([
    // Grab the trimmed classes from the token
    ...(token.attrGet('class') ?? '')
      .split(' ')
      .map((c) => c.trim())
      .filter((c) => c),
    // Add any from the meta information (these are often repeated)
    ...(token.meta?.class ?? []),
  ]);
  const className: string = [...allClasses].join(' ');
  if (!className) return undefined;
  return (
    className
      .split(' ')
      .map((c) => c.trim())
      .filter((c) => {
        if (!c) return false;
        if (!exclude) return true;
        return !exclude.reduce(
          (doExclude, test) => doExclude || !!c.match(test),
          false,
        );
      })
      .join(' ') || undefined
  );
}

function hasClassName(token: Token, matcher: RegExp): false | RegExpMatchArray {
  const className = getClassName(token);
  if (!className) return false;
  const matches = className
    .split(' ')
    .map((c) => c.match(matcher))
    .filter((c) => c);
  if (matches.length === 0) return false;
  return matches[0] as RegExpMatchArray;
}

function getLang(t: Token) {
  return he.decode(t.info).trim().split(' ')[0].replace('\\', '');
}

function getColAlign(t: Token) {
  if (t.attrs?.length) {
    for (const attrPair of t.attrs) {
      if (attrPair[0] === 'style') {
        const match = attrPair[1].match(/text-align:(left|right|center)/);
        if (match) {
          return match[1];
        }
      }
    }
  }
}

const defaultMdast: Record<string, Spec> = {
  heading: {
    type: 'heading',
    getAttrs(token) {
      return {
        depth: Number(token.tag[1]),
        enumerated: token.meta?.enumerated,
      };
    },
  },
  hr: {
    type: 'thematicBreak',
    noCloseToken: true,
    isLeaf: true,
  },
  paragraph: {
    type: 'paragraph',
  },
  blockquote: {
    type: 'blockquote',
  },
  ordered_list: {
    type: 'list',
    getAttrs(token, tokens, index) {
      const info = tokens[index + 1]?.info;
      const start = Number(tokens[index + 1]?.info);
      return {
        ordered: true,
        start: isNaN(start) || !info ? 1 : start,
        spread: false,
      };
    },
  },
  bullet_list: {
    type: 'list',
    attrs: {
      ordered: false,
      spread: false,
    },
  },
  list_item: {
    type: 'listItem',
    attrs: {
      spread: true,
    },
  },
  em: {
    type: 'emphasis',
  },
  strong: {
    type: 'strong',
  },
  fence: {
    type: 'code',
    isLeaf: true,
    getAttrs(t) {
      const name = t.meta?.name || undefined;
      const showLineNumbers = !!(
        t.meta?.linenos ||
        t.meta?.linenos === null || // Weird docutils implementation
        t.meta?.['number-lines']
      );
      const lineno = t.meta?.['lineno-start'] ?? t.meta?.['number-lines'];
      const startingLineNumber =
        lineno && lineno !== 1 && !isNaN(Number(lineno)) ? Number(lineno) : undefined;
      const emphasizeLines = t.meta?.['emphasize-lines']
        ? t.meta?.['emphasize-lines']
            .split(',')
            .map((n: string) => Number(n.trim()))
            .filter((n: number) => !isNaN(n) && n > 0)
        : undefined;

      return {
        lang: getLang(t),
        ...normalizeLabel(name),
        class: getClassName(t),
        showLineNumbers: showLineNumbers || undefined, // Only add to MDAST if true
        startingLineNumber: showLineNumbers ? startingLineNumber : undefined, // Only if showing line numbers!
        emphasizeLines,
        value: withoutTrailingNewline(t.content),
      };
    },
  },
  code_block: {
    type: 'code',
    isLeaf: true,
    getAttrs(t) {
      return { lang: getLang(t), value: withoutTrailingNewline(t.content) };
    },
  },
  code_inline: {
    type: 'inlineCode',
    noCloseToken: true,
    isText: true,
  },
  hardbreak: {
    type: 'break',
    noCloseToken: true,
    isLeaf: true,
  },
  link: {
    type: 'link',
    getAttrs(token) {
      return {
        url: token.attrGet('href'),
        title: token.attrGet('title') ?? undefined,
      };
    },
  },
  image: {
    type: 'image',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(token) {
      const alt =
        token.attrGet('alt') || token.children?.reduce((i, t) => i + t?.content, '');
      const alignMatch = hasClassName(token, ALIGN_CLASS);
      const align = alignMatch ? alignMatch[1] : undefined;
      return {
        url: token.attrGet('src'),
        alt: alt || undefined,
        title: token.attrGet('title') || undefined,
        class: getClassName(token, [ALIGN_CLASS]),
        width: token.attrGet('width') || undefined,
        align,
      };
    },
  },
  abbr: {
    type: 'abbreviation',
    getAttrs(token) {
      const value = token.children?.[0]?.content;
      return {
        title: token.attrGet('title') ?? undefined,
        value,
      };
    },
  },
  sub: {
    type: 'subscript',
  },
  sup: {
    type: 'superscript',
  },
  dl: {
    type: 'definitionList',
  },
  dt: {
    type: 'definitionTerm',
  },
  dd: {
    type: 'definitionDescription',
  },
  admonition: {
    type: 'admonition',
    getAttrs(token) {
      const kind = token.meta?.kind || undefined;
      return {
        kind,
        class: getClassName(token, [new RegExp(`admonition|${kind}`)]),
      };
    },
  },
  admonition_title: {
    type: 'admonitionTitle',
  },
  figure: {
    type: 'container',
    getAttrs(token): Container {
      const name = token.meta?.name || undefined;
      return {
        kind: 'figure',
        ...normalizeLabel(name),
        enumerated: token.meta?.enumerated,
        class: getClassName(token, [NUMBERED_CLASS]),
      };
    },
  },
  figure_caption: {
    type: 'caption',
  },
  figure_legend: {
    type: 'legend',
  },
  table: {
    type: 'table',
    getAttrs(token) {
      const name = token.meta?.name || undefined;
      return {
        kind: undefined,
        ...normalizeLabel(name),
        enumerated: token.meta?.enumerated,
        class: getClassName(token, [NUMBERED_CLASS, ALIGN_CLASS]),
        align: token.meta?.align || undefined,
      };
    },
  },
  table_caption: {
    type: 'caption',
  },
  thead: {
    type: '_lift',
  },
  tbody: {
    type: '_lift',
  },
  tr: {
    type: 'tableRow',
  },
  th: {
    type: 'tableCell',
    getAttrs(t) {
      return { header: true, align: getColAlign(t) || undefined };
    },
  },
  td: {
    type: 'tableCell',
    getAttrs(t) {
      return { align: getColAlign(t) || undefined };
    },
  },
  math_inline: {
    type: 'inlineMath',
    noCloseToken: true,
    isText: true,
  },
  math_inline_double: {
    type: 'math',
    noCloseToken: true,
    isText: true,
    getAttrs(t) {
      return {
        enumerated: t.meta?.enumerated,
      };
    },
  },
  math_block: {
    type: 'math',
    noCloseToken: true,
    isText: true,
    getAttrs(t) {
      const name = t.info || undefined;
      return {
        ...normalizeLabel(name),
        enumerated: t.meta?.enumerated,
      };
    },
  },
  math_block_label: {
    type: 'math',
    noCloseToken: true,
    isText: true,
    getAttrs(t) {
      const name = t.info || undefined;
      return {
        ...normalizeLabel(name),
        enumerated: t.meta?.enumerated,
      };
    },
  },
  amsmath: {
    type: 'math',
    noCloseToken: true,
    isText: true,
    getAttrs(t) {
      return {
        enumerated: t.meta?.enumerated,
      };
    },
  },
  ref: {
    type: 'crossReference',
    isLeaf: true,
    getAttrs(t) {
      return {
        kind: t.meta?.kind,
        ...normalizeLabel(t.meta?.label),
        value: t.meta?.value || undefined,
      };
    },
  },
  footnote_ref: {
    type: 'footnoteReference',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        ...normalizeLabel(t?.meta?.label),
      };
    },
  },
  footnote_anchor: {
    type: '_remove',
    noCloseToken: true,
  },
  footnote_block: {
    // The footnote block is a view concern, not AST
    // Lift footnotes out of the tree
    type: '_lift',
  },
  footnote: {
    type: 'footnoteDefinition',
    getAttrs(t) {
      return {
        ...normalizeLabel(t?.meta?.label),
      };
    },
  },
  directive: {
    type: 'mystDirective',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        name: t.info,
        args: t?.meta?.arg || undefined,
        value: t.content.trim(),
      };
    },
  },
  parsed_directive: {
    type: 'mystDirective',
    getAttrs(t) {
      let opts = t.meta?.opts;
      if (!opts || !Object.keys(opts).length) {
        opts = undefined;
      } else {
        if (opts.class) opts.class = opts.class.join(' ');
        Object.keys(opts).forEach((k) => {
          // Handle flags, where option is simply present.
          // This simple solution is very unlikely to be sufficient long term.
          if (opts[k] === null) opts[k] = true;
        });
      }
      return {
        name: t.info,
        args: t.meta?.arg || undefined,
        options: opts,
        value: t.content.trim() || undefined,
      };
    },
  },
  directive_error: {
    type: 'mystDirectiveError',
    noCloseToken: true,
  },
  role: {
    type: 'mystRole',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        name: t.meta?.name,
        value: t.content,
      };
    },
  },
  parsed_role: {
    type: 'mystRole',
    getAttrs(t) {
      return {
        name: t.meta.name,
        value: t.content,
      };
    },
  },
  role_error: {
    type: 'mystRoleError',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        value: t.content,
      };
    },
  },
  myst_target: {
    type: 'mystTarget',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        label: t.content,
      };
    },
  },
  html_inline: {
    type: 'html',
    noCloseToken: true,
    isText: true,
  },
  html_block: {
    type: 'html',
    noCloseToken: true,
    isText: true,
  },
  myst_block_break: {
    type: 'blockBreak',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        meta: t.content || undefined,
      };
    },
  },
  myst_line_comment: {
    type: 'mystComment',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        value: t.content.trim() || undefined,
      };
    },
  },
};

function hoistSingleImagesOutofParagraphs(tree: Root) {
  // Hoist up all paragraphs with a single image
  visit(tree, 'paragraph', (node) => {
    if (!(node.children?.length === 1 && node.children?.[0].type === 'image')) return;
    const child = node.children[0];
    Object.keys(node).forEach((k) => {
      delete (node as any)[k];
    });
    Object.assign(node, child);
  });
}

function nestSingleImagesIntoParagraphs(tree: Root) {
  tree.children = tree.children.map((node) => {
    if (node.type === 'image') {
      return { type: 'paragraph', children: [node] };
    } else {
      return node;
    }
  });
}

const defaultOptions: Options = {
  handlers: defaultMdast,
  hoistSingleImagesOutofParagraphs: true,
  nestBlocks: true,
};

export function tokensToMyst(tokens: Token[], options = defaultOptions): Root {
  const opts = {
    ...defaultOptions,
    ...options,
    handlers: { ...defaultOptions.handlers, ...options?.handlers },
  };
  const state = new MarkdownParseState(opts.handlers);
  state.parseTokens(tokens);
  let tree: Root;
  do {
    tree = state.closeNode() as Root;
  } while (state.stack.length);

  // Remove all redundant nodes marked for removal
  remove(tree, '_remove');

  // Lift up all nodes that are named "lift"
  liftChildren(tree, '_lift');

  // Remove unnecessary admonition titles from AST
  // These are up to the serializer to put in
  visit(tree, 'admonition', (node: Admonition) => {
    const { kind, children } = node;
    if (!kind || !children || kind === AdmonitionKind.admonition) return;
    const expectedTitle = admonitionKindToTitle(kind);
    const titleNode = children[0];
    if (
      titleNode.type === 'admonitionTitle' &&
      titleNode.children?.[0]?.value === expectedTitle
    )
      node.children = children.slice(1);
  });

  // Move crossReference text value to children
  visit(tree, 'crossReference', (node: GenericNode) => {
    delete node.children;
    if (node.value) {
      setTextAsChild(node, node.value);
      delete node.value;
    }
  });

  // Nest block content inside of a block
  if (opts.nestBlocks) {
    const newTree = u('root', [] as GenericNode[]);
    let lastBlock: GenericNode | undefined;
    const pushBlock = () => {
      if (!lastBlock) return;
      if (lastBlock.children?.length === 0) {
        delete lastBlock.children;
      }
      newTree.children.push(lastBlock);
    };
    (tree as GenericNode).children?.map((node) => {
      if (node.type === 'blockBreak') {
        pushBlock();
        lastBlock = node;
        node.type = 'block';
        node.children = node.children ?? [];
        return;
      }
      const stack = lastBlock ? lastBlock : newTree;
      stack.children?.push(node);
    });
    pushBlock();
    tree = newTree as Root;
  }

  ensureCaptionIsParagraph(tree);
  // Replace "table node with caption" with "figure node with table and caption"
  // TODO: Clean up when we update to typescript > 4.6.2 and we have access to
  //       parent in visitor function.
  //       i.e. visit(tree, 'table', (node, index parent) => {...})
  //       https://github.com/microsoft/TypeScript/issues/46900

  selectAll('table', tree).map((node: GenericNode) => {
    const captionChildren = node.children?.filter(
      (n: GenericNode) => n.type === 'caption',
    );
    if (captionChildren?.length) {
      const tableChildren = node.children?.filter(
        (n: GenericNode) => n.type !== 'caption',
      );
      const newTableNode: GenericNode = {
        type: 'table',
        align: node.align,
        children: tableChildren,
      };
      node.type = 'container';
      node.kind = 'table';
      node.children = [...captionChildren, newTableNode];
      delete node.align;
    } else {
      delete node.enumerated;
    }
  });

  if (opts.hoistSingleImagesOutofParagraphs) {
    hoistSingleImagesOutofParagraphs(tree);
  } else {
    nestSingleImagesIntoParagraphs(tree);
  }

  return tree;
}
