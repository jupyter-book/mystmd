import type { Root } from 'mdast';
import { filter } from 'unist-util-filter';
import { selectAll } from 'unist-util-select';
import type { IReferenceState, MultiPageReferenceState } from 'myst-transforms';
import type { GenericNode } from 'myst-common';
import { copyNode, normalizeLabel } from 'myst-common';
import { selectFile } from '../process';
import type { ISession } from '../session/types';
import type { Dependency } from './types';

/**
 * This is the {embed} directive, that embeds nodes from elsewhere in a page.
 */
export function embedDirective(
  session: ISession,
  mdast: Root,
  dependencies: Dependency[],
  state: IReferenceState,
) {
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
    if (!multiState.states) return;
    const { url, file } = multiState.resolveStateProvider(normalized.identifier) ?? {};
    if (!url) return;
    const source: Dependency = { url };
    if (file) {
      const { kind } = selectFile(session, file) ?? {};
      if (kind) source.kind = kind;
    }
    node.source = source;
    if (!dependencies.map((dep) => dep.url).includes(url)) dependencies.push(source);
  });
}
