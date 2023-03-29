import type { Root } from 'mdast';
import { filter } from 'unist-util-filter';
import { selectAll } from 'unist-util-select';
import type { IReferenceState, MultiPageReferenceState } from 'myst-transforms';
import type { GenericNode } from 'myst-common';
import { copyNode, normalizeLabel } from 'myst-common';

/**
 * This is the {embed} directive, that embeds nodes from elsewhere in a page.
 */
export function embedDirective(mdast: Root, dependencies: string[], state: IReferenceState) {
  const embedNodes = selectAll('embed', mdast) as GenericNode[];
  embedNodes.forEach((node) => {
    const normalized = normalizeLabel(node.label);
    if (!normalized) return;
    const target = state.getTarget(normalized.identifier);
    if (!target) return;
    let newNode = copyNode(target.node as any);
    if (node['remove-output']) {
      newNode = filter(newNode, (n: GenericNode) => n.type !== 'output');
    }
    if (node['remove-input']) {
      newNode = filter(newNode, (n: GenericNode) => n.type !== 'code');
    }
    node.children = newNode ? [newNode] : [];
    const multiState = state as MultiPageReferenceState;
    if (multiState.states) {
      const { url } = multiState.resolveStateProvider(normalized.identifier) ?? {};
      if (url) {
        node.source = url;
        if (!dependencies.includes(url)) dependencies.push(url);
      }
      const sourceKey = (target.node as any).key;
      if (sourceKey) node.sourceKey = sourceKey;
    }
  });
}
