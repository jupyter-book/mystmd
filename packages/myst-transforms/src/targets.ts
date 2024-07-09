import type { Plugin } from 'unified';
import { findAfter } from 'unist-util-find-after';
import { findBefore } from 'unist-util-find-before';
import { visit } from 'unist-util-visit';
import { remove } from 'unist-util-remove';
import type { Target, Parent } from 'myst-spec';
import type { Heading } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { normalizeLabel, toText } from 'myst-common';

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
export function mystTargetsTransform(tree: GenericParent) {
  const paragraphs = selectAll('paragraph', tree) as GenericParent[];
  paragraphs.forEach((paragraph) => {
    if (paragraph.children?.length !== 1) return;
    const target = paragraph.children[0];
    if (target.type !== 'mystTarget') return;
    paragraph.type = target.type;
    paragraph.label = target.label;
    paragraph.position = target.position;
  });
  visit(tree, 'mystTarget', (node: Target, index: number, parent: Parent) => {
    // TODO: have multiple targets and collect the labels
    const normalized = normalizeLabel(node.label);
    if (!normalized) return;
    let targetedNode = findAfter(parent, index) as GenericNode;
    if (!targetedNode && parent.type === 'heading') {
      targetedNode = parent;
      // Strip trailing whitespace if there is a label
      const headingText = selectAll('text', targetedNode) as GenericNode[];
      const lastHeadingText = headingText[headingText.length - 1];
      lastHeadingText.value = lastHeadingText.value?.trimEnd();
    }
    if (!targetedNode) {
      const prevNode = findBefore(parent, index) as GenericNode;
      if (prevNode?.type === 'image') targetedNode = prevNode;
    }
    if (targetedNode && normalized) {
      // TODO: raise error if the node is already labelled
      targetedNode.identifier = normalized.identifier;
      targetedNode.label = normalized.label;
      targetedNode.html_id = normalized.html_id;
    }
  });
  remove(tree, 'mystTarget');
}

export const mystTargetsPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  mystTargetsTransform(tree);
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
