import type { GenericNode } from 'myst-common';
import type { Root } from 'myst-spec';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';

/**
 * Consolidate all caption/legend nodes on a container to a single caption
 */
export function transformLegends(mdast: Root) {
  const containers = selectAll('container', mdast) as GenericNode[];
  containers.forEach((container: GenericNode) => {
    const captionsAndLegends = container.children?.filter((child: GenericNode) => {
      return child.type === 'caption' || child.type === 'legend';
    });
    if (!captionsAndLegends?.length) return;
    captionsAndLegends[0].type = 'caption';
    captionsAndLegends.slice(1).forEach((node) => {
      if (captionsAndLegends[0].children && node.children) {
        captionsAndLegends[0].children?.push(...node.children);
      }
      node.type = '__delete__';
    });
  });
  remove(mdast, '__delete__');
}
