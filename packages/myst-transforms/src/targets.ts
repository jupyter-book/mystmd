import type { Plugin } from 'unified';
import { findAfter } from 'unist-util-find-after';
import { visit } from 'unist-util-visit';
import { remove } from 'unist-util-remove';
import type { Root } from 'mdast';
import type { Target, Heading, Parent } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import { normalizeLabel, toText } from 'myst-utils';

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
  visit(tree, 'mystTarget', (node: Target, index: number, parent: Parent) => {
    // TODO: have multiple targets and collect the labels
    const nextNode = findAfter(parent, index) as any;
    const normalized = normalizeLabel(node.label);
    if (nextNode && normalized) {
      nextNode.identifier = normalized.identifier;
      nextNode.label = normalized.label;
      nextNode.html_id = normalized.html_id;
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
      node.identifier = normalized.identifier;
      node.label = normalized.label;
      (node as any).html_id = normalized.html_id;
      // The target is marked as implicit
      // This will not warn on duplicates
      (node as any).implicit = true;
    }
  });
}

export const headingLabelPlugin: Plugin<[], Root, Root> = () => (tree) => {
  headingLabelTransform(tree);
};
