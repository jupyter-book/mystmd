import type { Root } from 'mdast';
import { filter } from 'unist-util-filter';
import { selectAll } from 'unist-util-select';
import type { IReferenceState, MultiPageReferenceState } from 'myst-transforms';
import type { GenericNode } from 'myst-common';
import { copyNode, liftChildren, normalizeLabel } from 'myst-common';
import type { Dependency, Embed, Container } from 'myst-spec-ext';
import { selectFile } from '../process/index.js';
import type { ISession } from '../session/types.js';

/**
 * This is the {embed} directive, that embeds nodes from elsewhere in a page.
 */
export function embedDirective(
  session: ISession,
  mdast: Root,
  dependencies: Dependency[],
  state: IReferenceState,
) {
  const embedNodes = selectAll('embed', mdast) as Embed[];
  embedNodes.forEach((node) => {
    const normalized = normalizeLabel(node.label);
    if (!normalized) return;
    const target = state.getTarget(normalized.identifier);
    if (!target) return;
    let newNode = copyNode(target.node as any) as GenericNode | null;
    if (newNode && node['remove-output']) {
      newNode = filter(newNode, (n: GenericNode) => n.type !== 'output');
    }
    if (newNode && node['remove-input']) {
      newNode = filter(newNode, (n: GenericNode) => n.type !== 'code');
    }
    selectAll('[identifier],[label]', newNode).forEach((idNode: GenericNode) => {
      delete idNode.identifier;
      delete idNode.label;
    });
    if (!newNode) {
      node.children = [];
    } else if (newNode.type === 'block') {
      // Do not nest a single block inside an embed
      node.children = newNode.children as any[];
    } else {
      node.children = [newNode as any];
    }
    const multiState = state as MultiPageReferenceState;
    if (!multiState.states) return;
    const { url, file } = multiState.resolveStateProvider(normalized.identifier) ?? {};
    if (!url) return;
    const source: Dependency = { url };
    if (file) {
      const { kind, slug, frontmatter } = selectFile(session, file) ?? {};
      if (kind) source.kind = kind;
      if (slug) source.slug = slug;
      if (frontmatter?.title) source.title = frontmatter.title;
      if (frontmatter?.short_title) source.short_title = frontmatter.short_title;
    }
    node.source = source;
    if (!dependencies.map((dep) => dep.url).includes(url)) dependencies.push(source);
  });
  // If a figure contains a single embed node, move the source info to the figure and lift
  // the embed children, eliminating the embed node.
  const containerNodes = selectAll('container', mdast) as Container[];
  containerNodes.forEach((node: GenericNode) => {
    const containerEmbeds = node.children?.filter((child: GenericNode) => child.type === 'embed');
    if (containerEmbeds?.length === 1) {
      node.source = { ...containerEmbeds[0].source, label: containerEmbeds[0].label };
      containerEmbeds[0].type = '_lift';
    }
  });
  liftChildren(mdast, '_lift');
}
