import type { Plugin } from 'unified';
import { findAfter } from 'unist-util-find-after';
import { visit } from 'unist-util-visit';
import { remove } from 'unist-util-remove';
import type { Root } from 'mdast';
import type { Target, Heading } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import { normalizeLabel, toText } from './utils';

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
export function mystTargetsTransform(tree: Root) {
  visit(tree, 'mystTarget', (node: Target, index: number) => {
    // TODO: have multiple targets and collect the labels
    const nextNode = findAfter(tree, index) as any;
    const normalized = normalizeLabel(node.label);
    if (nextNode && normalized) {
      nextNode.identifier = normalized.identifier;
      nextNode.label = normalized.label;
    }
  });
  remove(tree, 'mystTarget');
}

export const mystTargetsPlugin: Plugin<[], Root, Root> = () => (tree) => {
  mystTargetsTransform(tree);
};

export function headingLabelTransform(tree: Root) {
  const headings = selectAll('heading', tree) as Heading[];
  headings.forEach((node) => {
    if (node.label || node.identifier) return;
    const normalized = normalizeLabel(toText(node.children));
    if (normalized) {
      // These are used for heading URL slugs
      node.identifier = normalized.identifier.replace(/\s/g, '-');
      node.label = normalized.label;
    }
  });
}

export const headingLabelPlugin: Plugin<[], Root, Root> = () => (tree) => {
  headingLabelTransform(tree);
};
