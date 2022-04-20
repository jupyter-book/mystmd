import { Root } from 'mdast';
import { unified, Plugin } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import { all } from 'hast-util-to-mdast';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAfter } from 'unist-util-find-after';
import { remove } from 'unist-util-remove';
import { map } from 'unist-util-map';
import { Admonition, AdmonitionKind, GenericNode } from './types';
import { admonitionKindToTitle, normalizeLabel } from './utils';
import { EnumeratorOptions, State, enumerateTargets, resolveReferences } from './state';

export type TransformOptions = {
  addAdmonitionHeaders?: boolean;
  addContainerCaptionNumbers?: boolean;
} & EnumeratorOptions;

const defaultOptions: Record<keyof TransformOptions, boolean> = {
  addAdmonitionHeaders: true,
  addContainerCaptionNumbers: true,
  disableHeadingEnumeration: false,
  disableContainerEnumeration: false,
  disableEquationEnumeration: false,
};

// Visit all admonitions and add headers if necessary
export function addAdmonitionHeaders(tree: Root) {
  visit(tree, 'admonition', (node: Admonition) => {
    if (!node.kind || node.kind === AdmonitionKind.admonition) return;
    node.children = [
      {
        type: 'admonitionTitle',
        children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
      },
      ...(node.children ?? []),
    ];
  });
}

// Visit all containers and add captions
export function addContainerCaptionNumbers(tree: Root, state: State) {
  selectAll('container', tree)
    .filter((container: GenericNode) => container.enumerator !== false)
    .forEach((container: GenericNode) => {
      const enumerator = state.getTarget(container.identifier)?.node.enumerator;
      const para = select('caption > paragraph', container) as GenericNode;
      if (enumerator && para) {
        para.children = [
          { type: 'captionNumber', kind: container.kind, value: enumerator },
          ...(para?.children ?? []),
        ];
      }
    });
}

export function liftChildren(tree: Root, nodeType: string) {
  map(tree, (node: GenericNode) => {
    const children = node.children
      ?.map((child: GenericNode) => {
        if (child.type === nodeType && child.children) return child.children;
        return child;
      })
      ?.flat();
    if (children !== undefined) node.children = children;
    return node;
  });
}

/**
 * Propagate target identifier/value to subsequent node
 *
 * Note: While this propagation happens regardless of the
 * subsequent node type, references are only resolved to
 * the TargetKind nodes enumerated in state.ts. For example:
 *
 * (paragraph-target)=
 * Just a normal paragraph
 *
 * will add identifier/label to paragraph node, but the node
 * will still not be targetable.
 */

export function propagateTargets(tree: Root) {
  visit(tree, 'mystTarget', (node: GenericNode) => {
    const nextNode = findAfter(tree, node) as GenericNode;
    const normalized = normalizeLabel(node.label);
    if (nextNode && normalized) {
      nextNode.identifier = normalized.identifier;
      nextNode.label = normalized.label;
    }
  });
  remove(tree, 'mystTarget');
}

/**
 * Ensure caption content is nested in a paragraph.
 *
 * This function is idempotent!
 */
export function ensureCaptionIsParagraph(tree: Root) {
  visit(tree, 'caption', (node: GenericNode) => {
    if (node.children && node.children[0].type !== 'paragraph') {
      node.children = [{ type: 'paragraph', children: node.children }];
    }
  });
}

export function convertHtmlToMdast(tree: Root) {
  const htmlNodes = selectAll('html', tree);
  htmlNodes.forEach((node: GenericNode) => {
    const hast = unified().use(rehypeParse, { fragment: true }).parse(node.value);
    const mdast = unified()
      .use(rehypeRemark, {
        handlers: {
          table(h, node) {
            return h(node, 'table', all(h, node));
          },
          th(h, node) {
            const result = h(node, 'tableCell', all(h, node));
            (result as GenericNode).header = true;
            return result;
          },
        },
      })
      .runSync(hast);
    node.type = 'htmlParsed';
    node.children = mdast.children as GenericNode[];
    visit(node, (n: GenericNode) => delete n.position);
  });
  liftChildren(tree, 'htmlParsed');
  return tree;
}

export const transform: Plugin<[State, TransformOptions?], string, Root> =
  (state, o) => (tree: Root) => {
    const opts = {
      ...defaultOptions,
      ...o,
    };
    ensureCaptionIsParagraph(tree);
    propagateTargets(tree);
    enumerateTargets(state, tree, opts);
    resolveReferences(state, tree);
    liftChildren(tree, 'mystDirective');
    liftChildren(tree, 'mystRole');
    if (opts.addAdmonitionHeaders) addAdmonitionHeaders(tree);
    if (opts.addContainerCaptionNumbers) addContainerCaptionNumbers(tree, state);
  };
