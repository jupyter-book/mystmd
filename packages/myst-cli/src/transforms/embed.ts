import { filter } from 'unist-util-filter';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import type { IReferenceState, MultiPageReferenceState } from 'myst-transforms';
import type { GenericNode, GenericParent } from 'myst-common';
import { copyNode, liftChildren, normalizeLabel } from 'myst-common';
import type { Dependency, Embed, Container } from 'myst-spec-ext';
import { selectFile } from '../process/file.js';
import type { ISession } from '../session/types.js';

/**
 * This is the {embed} directive, that embeds nodes from elsewhere in a page.
 */
export function embedTransform(
  session: ISession,
  mdast: GenericParent,
  dependencies: Dependency[],
  state: IReferenceState,
) {
  const embedNodes = selectAll('embed', mdast) as Embed[];
  embedNodes.forEach((node) => {
    const normalized = normalizeLabel(node.source?.label);
    if (!normalized) return;
    const target = state.getTarget(normalized.identifier);
    if (!target) return;
    let newNode = copyNode(target.node as any) as GenericNode | null;
    if (newNode && node['remove-output']) {
      newNode = filter(newNode, (n: GenericNode) => {
        return n.type !== 'output' && n.data?.type !== 'output';
      });
    }
    if (newNode && node['remove-input']) {
      newNode = filter(newNode, (n: GenericNode) => {
        return n.type !== 'code' || n.data?.type === 'output';
      });
    }
    selectAll('[identifier],[label],[html_id]', newNode).forEach((idNode: GenericNode) => {
      delete idNode.identifier;
      delete idNode.label;
      delete idNode.html_id;
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
    const source: Dependency = { url, label: node.source?.label };
    if (file) {
      const { kind, slug, frontmatter, location } = selectFile(session, file) ?? {};
      if (kind) source.kind = kind;
      if (slug) source.slug = slug;
      if (location) source.location = location;
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
      node.source = { ...containerEmbeds[0].source };
      containerEmbeds[0].type = '_lift';
      // If the figure's embedded content is _another_ figure, just lift out the children except caption/legend
      if (
        containerEmbeds[0].children?.length === 1 &&
        containerEmbeds[0].children[0].type === 'container'
      ) {
        containerEmbeds[0].children[0].type = '_lift';
        // It would be nice to keep these if there is not another caption defined on 'node' but that leads to
        // issues with the current figure enumeration resolution, since embedding happens after referencing...
        remove(containerEmbeds[0].children[0], 'caption');
        remove(containerEmbeds[0].children[0], 'legend');
      }
    }
  });
  // If embed node contains a single figure, copy the source info to the figure
  const remainingEmbedNodes = selectAll('embed', mdast) as Embed[];
  remainingEmbedNodes.forEach((node: Embed) => {
    if (node.children?.length === 1 && node.children[0].type === 'container') {
      (node.children[0] as any).source = { ...node.source };
      (node as any).type = '_lift';
    }
  });
  liftChildren(mdast, '_lift');
}
