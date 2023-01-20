import type { GenericNode } from 'mystjs';
import type { Root } from 'mdast';
import { filter } from 'unist-util-filter';
import { selectAll } from 'unist-util-select';
import type { IReferenceState } from 'myst-transforms';
import { normalizeLabel } from 'myst-common';

/**
 * This is the {embed} directive, that embeds nodes from elsewhere in a page.
 */
export function embedDirective(mdast: Root, state: IReferenceState) {
  const embedNodes = selectAll('embed', mdast) as GenericNode[];
  embedNodes.forEach((node) => {
    const normalized = normalizeLabel(node.label);
    if (!normalized) return;
    const target = state.getTarget(normalized.identifier);
    if (!target) return;
    let newNode = target.node as any;
    if (node['remove-output']) {
      newNode = filter(newNode, (n: GenericNode) => n.type !== 'output');
    }
    if (node['remove-input']) {
      newNode = filter(newNode, (n: GenericNode) => n.type !== 'code');
    }
    node.children = [newNode];
  });
}
