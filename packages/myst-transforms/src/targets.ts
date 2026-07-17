import type { Plugin } from 'unified';
import { findAfter } from 'unist-util-find-after';
import { visit } from 'unist-util-visit';
import { remove } from 'unist-util-remove';
import type { Target, Parent } from 'myst-spec';
import type { Heading } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';
import { normalizeLabel, toText, transferTargetAttrs } from 'myst-common';
import type { VFile } from 'vfile';

/**
 * Propagate target identifier/value to subsequent node
 *
 * Propagation happens regardless of the subsequent node type.
 * For example:
 *
 * ```markdown
 * (paragraph-target)=
 * Just a normal paragraph
 * ```
 *
 * will add identifier/label to paragraph node.
 *
 * Note, this should happen after `mystDirective`s have been lifted,
 * and other structural changes to the tree that don't preserve labels.
 */
export function mystTargetsTransform(tree: GenericParent, vfile: VFile) {
  visit(tree, 'mystTarget', (node: Target, index: number, parent: Parent) => {
    // TODO: have multiple targets and collect the labels
    const nextNode = findAfter(parent, index) as any;
    const normalized = { ...node, ...normalizeLabel(node.label) };
    if (nextNode && normalized) {
      transferTargetAttrs(normalized, nextNode, vfile);
    }
  });
  remove(tree, 'mystTarget');
}

export const mystTargetsPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree, vfile) => {
  mystTargetsTransform(tree, vfile);
};

/**
 * Add implicit labels & identifiers to all headings
 */
export function headingLabelTransform(tree: GenericParent) {
  const headings = selectAll('heading', tree) as Heading[];
  headings.forEach((node) => {
    if (node.label || node.identifier) return;
    const normalized = normalizeLabel(toText(node.children));
    if (normalized) {
      // For implicit header identifiers, use the html_id rather than the normalized label
      node.identifier = normalized.html_id;
      node.label = normalized.label;
      node.html_id = normalized.html_id;
      // The target is marked as implicit
      // This will not warn on duplicates
      node.implicit = true;
    }
  });
}

export const headingLabelPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  headingLabelTransform(tree);
};
